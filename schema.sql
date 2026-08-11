-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standard Chart of Accounts Reference Table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL -- 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
);

-- Uploaded Raw & Classified Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    raw_payload JSONB,
    classified_category_code VARCHAR(10) REFERENCES chart_of_accounts(code),
    confidence_score NUMERIC(3, 2), -- 0.00 to 1.00
    classification_reason TEXT,
    client_clarification_needed BOOLEAN DEFAULT FALSE,
    client_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Standard COA Data
INSERT INTO chart_of_accounts (code, name, type) VALUES
('1000', 'Cash and Cash Equivalents', 'Asset'),
('1200', 'Accounts Receivable', 'Asset'),
('2000', 'Accounts Payable', 'Liability'),
('3000', 'Retained Earnings', 'Equity'),
('4000', 'Sales Revenue', 'Revenue'),
('5000', 'Cost of Goods Sold (COGS)', 'Expense'),
('5100', 'Office Supplies & Software', 'Expense'),
('5200', 'Rent & Lease Expenses', 'Expense'),
('5300', 'Travel & Entertainment', 'Expense'),
('5400', 'Professional Services (Legal/Accounting)', 'Expense'),
('5500', 'Payroll & Employee Benefits', 'Expense')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type;
