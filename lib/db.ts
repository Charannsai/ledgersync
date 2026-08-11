import { createClient, Client } from '@libsql/client';
import { STANDARD_COA } from './coa';

let clientInstance: Client | null = null;
let initialized = false;

export function getDBClient(): Client {
  if (!clientInstance) {
    clientInstance = createClient({
      url: 'file:ledgersync.db'
    });
  }
  return clientInstance;
}

export async function initDB() {
  if (initialized) return;
  const db = getDBClient();

  // 1. Chart of Accounts table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    );
  `);

  // 2. Transactions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      classified_category_code TEXT,
      confidence_score REAL,
      classification_reason TEXT,
      client_clarification_needed INTEGER DEFAULT 0,
      client_response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (classified_category_code) REFERENCES chart_of_accounts(code)
    );
  `);

  // 3. Seed COA table if empty
  const countRes = await db.execute('SELECT COUNT(*) as count FROM chart_of_accounts');
  const count = Number(countRes.rows[0]?.count || 0);

  if (count === 0) {
    for (const item of STANDARD_COA) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO chart_of_accounts (code, name, type) VALUES (?, ?, ?)',
        args: [item.code, item.name, item.type]
      });
    }
  }

  initialized = true;
}

export interface DBTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  classified_category_code?: string | null;
  confidence_score?: number | null;
  classification_reason?: string | null;
  client_clarification_needed?: number | boolean;
  client_response?: string | null;
  created_at?: string;
}

export async function saveTransactionsToDB(transactions: DBTransaction[]) {
  await initDB();
  const db = getDBClient();

  for (const tx of transactions) {
    await db.execute({
      sql: `
        INSERT INTO transactions (
          id, date, description, amount, classified_category_code, confidence_score, classification_reason, client_clarification_needed
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?
        ) ON CONFLICT(id) DO UPDATE SET
          date = excluded.date,
          description = excluded.description,
          amount = excluded.amount,
          classified_category_code = excluded.classified_category_code,
          confidence_score = excluded.confidence_score,
          classification_reason = excluded.classification_reason,
          client_clarification_needed = excluded.client_clarification_needed;
      `,
      args: [
        tx.id,
        tx.date,
        tx.description,
        tx.amount,
        tx.classified_category_code || null,
        tx.confidence_score !== undefined && tx.confidence_score !== null ? tx.confidence_score : null,
        tx.classification_reason || null,
        tx.client_clarification_needed ? 1 : 0
      ]
    });
  }
}

export async function updateTransactionCategoryInDB(id: string, categoryCode: string): Promise<boolean> {
  await initDB();
  const db = getDBClient();

  const res = await db.execute({
    sql: `
      UPDATE transactions
      SET classified_category_code = ?,
          confidence_score = 1.0,
          client_clarification_needed = 0,
          classification_reason = 'Manually overridden by accountant to COA code ' || ?
      WHERE id = ?
    `,
    args: [categoryCode, categoryCode, id]
  });

  return res.rowsAffected > 0;
}

export async function fetchAllTransactionsFromDB(): Promise<DBTransaction[]> {
  await initDB();
  const db = getDBClient();

  const res = await db.execute('SELECT * FROM transactions ORDER BY created_at DESC');

  return res.rows.map((row: any) => ({
    id: String(row.id),
    date: String(row.date),
    description: String(row.description),
    amount: Number(row.amount),
    classified_category_code: row.classified_category_code ? String(row.classified_category_code) : null,
    confidence_score: row.confidence_score !== null ? Number(row.confidence_score) : null,
    classification_reason: row.classification_reason ? String(row.classification_reason) : null,
    client_clarification_needed: Boolean(row.client_clarification_needed),
    client_response: row.client_response ? String(row.client_response) : null,
    created_at: row.created_at ? String(row.created_at) : undefined
  }));
}
