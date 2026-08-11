import OpenAI from 'openai';
import { z } from 'zod';

export interface RawTransactionInput {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface ClassificationResult {
  raw_id: string;
  suggested_code: string;
  confidence: number;
  reason: string;
  clarification_needed: boolean;
}

export const ClassificationSchema = z.object({
  classifications: z.array(
    z.object({
      raw_id: z.string(),
      suggested_code: z.string(),
      confidence: z.number(),
      reason: z.string(),
      clarification_needed: z.boolean()
    })
  )
});

const SYSTEM_PROMPT = `You are an expert, meticulous forensic accountant. Your task is to classify raw transaction logs into a standard Chart of Accounts (COA).

Standard COA:
- 1000: Cash and Cash Equivalents
- 1200: Accounts Receivable
- 2000: Accounts Payable
- 3000: Retained Earnings
- 4000: Sales Revenue
- 5000: Cost of Goods Sold (COGS)
- 5100: Office Supplies & Software (includes SaaS platforms like Slack, AWS, Zoom)
- 5200: Rent & Lease Expenses
- 5300: Travel & Entertainment (includes Uber, Airlines, Restaurants)
- 5400: Professional Services (Legal/Accounting)
- 5500: Payroll & Employee Benefits (includes ADP, Gusto, direct wages)

For each transaction, provide:
1. The correct COA code.
2. A confidence score (0.00 to 1.00) based on how explicit the description is.
3. A brief, one-sentence logical justification.
4. A boolean 'clarification_needed' flag set to true if the item is ambiguous (e.g., generic names like 'Amazon', 'AMZN', 'Target', 'Transfer', or atypical amounts with vague names).`;

export async function classifyTransactionsWithAI(
  transactions: RawTransactionInput[]
): Promise<ClassificationResult[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your-key')) {
    try {
      const openai = new OpenAI({ apiKey });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Classify the following batch of transactions:\n${JSON.stringify(transactions, null, 2)}`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const validated = ClassificationSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data.classifications;
        }
      }
    } catch (err) {
      console.warn('OpenAI API call failed or timed out. Falling back to local forensic classification engine.', err);
    }
  }

  // Fallback intelligent forensic classification engine
  return transactions.map((tx) => fallbackClassify(tx));
}

function fallbackClassify(tx: RawTransactionInput): ClassificationResult {
  const desc = tx.description.toUpperCase();
  const amt = Math.abs(tx.amount);

  // 1. Vague Vendor / Amazon Marketplace Check (PRD Scenario 1)
  if (desc.includes('AMZN') || desc.includes('AMAZON') || desc.includes('TARGET') || desc.includes('TRANSFER')) {
    return {
      raw_id: tx.id,
      suggested_code: '5100',
      confidence: 0.42,
      reason: "Amazon Marketplace transaction is vague and could represent office supplies, resale inventory (COGS), or capital assets; client clarification required.",
      clarification_needed: true
    };
  }

  // 2. Payroll Processors (PRD Scenario 2)
  if (desc.includes('ADP') || desc.includes('GUSTO') || desc.includes('RIPPLING') || desc.includes('PAYROLL') || desc.includes('WAGES')) {
    return {
      raw_id: tx.id,
      suggested_code: '5500',
      confidence: 0.98,
      reason: "Explicit mention of payroll processor and fee/salary disbursement aligns directly with Payroll & Employee Benefits.",
      clarification_needed: false
    };
  }

  // 3. Rent & Co-working (PRD Scenario 3)
  if (desc.includes('REGUS') || desc.includes('WEWORK') || desc.includes('RENT') || desc.includes('LEASE')) {
    return {
      raw_id: tx.id,
      suggested_code: '5200',
      confidence: 0.95,
      reason: "Description specifies workspace lease/rent vendor, categorized under Rent & Lease Expenses.",
      clarification_needed: false
    };
  }

  // 4. Cloud Infrastructure & SaaS Software
  if (desc.includes('AWS') || desc.includes('SLACK') || desc.includes('ZOOM') || desc.includes('GOOGLE') || desc.includes('GITHUB') || desc.includes('MICROSOFT')) {
    return {
      raw_id: tx.id,
      suggested_code: '5100',
      confidence: 0.98,
      reason: "Recognized cloud software infrastructure SaaS subscription categorized under Office Supplies & Software.",
      clarification_needed: false
    };
  }

  // 5. Travel & Rideshare
  if (desc.includes('UBER') || desc.includes('LYFT') || desc.includes('DELTA') || desc.includes('UNITED') || desc.includes('AIRBNB') || desc.includes('HOTEL')) {
    return {
      raw_id: tx.id,
      suggested_code: '5300',
      confidence: 0.92,
      reason: "Recognized transit or lodging vendor categorized under Travel & Entertainment.",
      clarification_needed: false
    };
  }

  // 6. Professional Services
  if (desc.includes('LEGAL') || desc.includes('COOLEY') || desc.includes('DELOITTE') || desc.includes('CPA') || desc.includes('ATTORNEY')) {
    return {
      raw_id: tx.id,
      suggested_code: '5400',
      confidence: 0.94,
      reason: "Legal or accounting professional service fee identified.",
      clarification_needed: false
    };
  }

  // 7. Revenue / Inflow
  if (tx.amount > 0 || desc.includes('STRIPE') || desc.includes('SQUARE') || desc.includes('CLIENT INVOICE')) {
    return {
      raw_id: tx.id,
      suggested_code: '4000',
      confidence: 0.89,
      reason: "Inflow / Payment deposit recognized as Sales Revenue.",
      clarification_needed: false
    };
  }

  // Generic Default
  return {
    raw_id: tx.id,
    suggested_code: '5000',
    confidence: 0.48,
    reason: "Ambiguous description without explicit vendor match; requires client clarification.",
    clarification_needed: true
  };
}

export async function generateClientEmailDraft(
  tx: RawTransactionInput,
  clientName: string = 'Client',
  accountantName: string = 'Accountant'
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your-key')) {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional, polite accounting consultant drafting a concise clarification email to a client regarding an ambiguous transaction log item.'
          },
          {
            role: 'user',
            content: `Draft a client email for the following transaction:
Date: ${tx.date}
Description: ${tx.description}
Amount: $${Math.abs(tx.amount).toFixed(2)}
Client Name: ${clientName}
Accountant Name: ${accountantName}`
          }
        ]
      });

      const emailText = response.choices[0]?.message?.content;
      if (emailText) return emailText;
    } catch (err) {
      console.warn('OpenAI email draft API call failed. Using fallback template generator.', err);
    }
  }

  // High-quality PRD-aligned email fallback template
  return `Hi ${clientName},

I hope you're well. While processing your books for last month, we noticed a charge of $${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${tx.description} on ${tx.date}.

Could you clarify what business items or services were purchased in this transaction so we can classify it accurately under Office Supplies, COGS, or Capital Assets?

Thank you,
${accountantName}`;
}
