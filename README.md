# LedgerSync AI — QuickBooks & Bank Ledger COA Parser

**LedgerSync AI** is a targeted accounting workbench built to parse messy bank and QuickBooks transaction logs, dynamically map custom column schemas, classify line items to a standard Chart of Accounts (COA) using AI structured outputs, flag ambiguous transactions, and generate contextual client clarification emails.

---

## ⚡ Key Features

- **CSV / JSON Dynamic Schema Mapper**: Drag & drop raw banking exports or QuickBooks files and dynamically map column headers (**Date**, **Vendor/Description**, **Amount**).
- **AI Classification Pipeline (Groq LLM)**: Leverages Groq's high-speed **`llama-3.3-70b-versatile`** model to map raw log descriptions into standard COA codes (`1000`, `1200`, `2000`, `3000`, `4000`, `5000`, `5100`, `5200`, `5300`, `5400`, `5500`).
- **Anomaly Flagging & Live Review Board**: Real-time metric indicators (Processed Volume, Flagged Items, Low Confidence, High Confidence Rate), inline manual COA dropdown overrides, and clean CSV export.
- **Contextual Client Email Generator**: AI drafts polite, highly specific clarification emails referencing the transaction date, amount, vendor description, and clarifying questions.
- **Dual Database Persistence**:
  - **SQLite** (`ledgersync.db` via `@libsql/client`) for zero-config local persistence of transactions and manual accountant overrides.
  - **PostgreSQL** ([schema.sql](file:///c:/Users/pathu/OneDrive/Desktop/ledgersync/schema.sql)) for Supabase integration.
- **Minimalist Executive Aesthetic**: Ultra-clean UI styled with neutral black/white palette, lime green accents, and Google's **Inter** font stack.

---

## 🛠️ Technical Stack

- **Framework**: Next.js 16+ (App Router, TypeScript)
- **Styling**: Tailwind CSS v4, `lucide-react`, Google **Inter** font
- **AI Engine**: `groq-sdk` (`llama-3.3-70b-versatile` structured outputs) with a rule-based forensic fallback engine
- **Database**: LibSQL / SQLite (`@libsql/client`) & PostgreSQL ([schema.sql](file:///c:/Users/pathu/OneDrive/Desktop/ledgersync/schema.sql))
- **Parser**: `papaparse` for browser CSV streaming, `zod` validation

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Charannsai/ledgersync.git
cd ledgersync
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Standard Chart of Accounts (COA) Reference

| Code | Category Name | Account Type | Examples |
| :--- | :--- | :--- | :--- |
| **1000** | Cash and Cash Equivalents | Asset | Checking Deposits, Wire Transfers |
| **1200** | Accounts Receivable | Asset | Outstanding Customer Invoices |
| **2000** | Accounts Payable | Liability | Vendor Bill Payments |
| **3000** | Retained Earnings | Equity | Owner Equity Draw / Retained Net Income |
| **4000** | Sales Revenue | Revenue | Stripe Payouts, Client Invoices |
| **5000** | Cost of Goods Sold (COGS) | Expense | Raw Material Purchases |
| **5100** | Office Supplies & Software | Expense | AWS, Slack, Zoom, Google Workspace |
| **5200** | Rent & Lease Expenses | Expense | Regus Workspace, WeWork, Real Estate Leases |
| **5300** | Travel & Entertainment | Expense | Uber, Rideshare, Delta Air Lines, Hotels |
| **5400** | Professional Services | Expense | Legal retainer (Cooley), CPA Tax Fees |
| **5500** | Payroll & Employee Benefits | Expense | ADP Payroll, Gusto Wages, Rippling |

---

## 🧪 Sample Test Data

A pre-configured sample dataset is provided in `public/sample_ledger.csv`. You can download it directly from the app home screen or click **"Load Sample Data"** to run instant AI classification.
