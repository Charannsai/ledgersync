export interface ChartOfAccountItem {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description: string;
  examples: string[];
}

export const STANDARD_COA: ChartOfAccountItem[] = [
  {
    code: '1000',
    name: 'Cash and Cash Equivalents',
    type: 'Asset',
    description: 'Bank deposits, checking, money market funds',
    examples: ['Chase Bank Deposit', 'Wire Transfer In', 'Checking Deposit']
  },
  {
    code: '1200',
    name: 'Accounts Receivable',
    type: 'Asset',
    description: 'Money owed by customers for goods/services delivered',
    examples: ['Invoice #1042 Payment Due', 'Customer Receivables']
  },
  {
    code: '2000',
    name: 'Accounts Payable',
    type: 'Liability',
    description: 'Short-term obligations owed to suppliers/vendors',
    examples: ['Vendor Bill Payment', 'Supplier Clearing Account']
  },
  {
    code: '3000',
    name: 'Retained Earnings',
    type: 'Equity',
    description: 'Cumulative net income retained in the business',
    examples: ['Owner Distribution', 'Equity Draw']
  },
  {
    code: '4000',
    name: 'Sales Revenue',
    type: 'Revenue',
    description: 'Income generated from sale of goods or services',
    examples: ['Stripe Payout', 'Square Deposit', 'Client Service Fee Income']
  },
  {
    code: '5000',
    name: 'Cost of Goods Sold (COGS)',
    type: 'Expense',
    description: 'Direct costs of producing goods or delivering primary services',
    examples: ['Inventory Batch Direct Purchase', 'Raw Materials Supplier']
  },
  {
    code: '5100',
    name: 'Office Supplies & Software',
    type: 'Expense',
    description: 'SaaS platforms, cloud infrastructure, office materials',
    examples: ['AWS Billing', 'Slack Technologies', 'Zoom Communications', 'Google Workspace', 'GitHub Subscription']
  },
  {
    code: '5200',
    name: 'Rent & Lease Expenses',
    type: 'Expense',
    description: 'Real estate leases, co-working spaces, equipment rentals',
    examples: ['Regus Workspace Rent', 'WeWork Office Space', 'Commercial Lease Payment']
  },
  {
    code: '5300',
    name: 'Travel & Entertainment',
    type: 'Expense',
    description: 'Rideshares, airlines, lodging, business meals & dining',
    examples: ['Uber Trip', 'Lyft Rides', 'Delta Air Lines', 'Marriott Hotel', 'Starbucks Business Meal']
  },
  {
    code: '5400',
    name: 'Professional Services (Legal/Accounting)',
    type: 'Expense',
    description: 'Legal retainer fees, CPA tax preparation, advisory services',
    examples: ['Cooley LLP Retainer', 'Deloitte Audit Fee', 'KPMG Consulting']
  },
  {
    code: '5500',
    name: 'Payroll & Employee Benefits',
    type: 'Expense',
    description: 'Wages, payroll processing fees, employee health insurance',
    examples: ['ADP Payroll Fees', 'Gusto Wages Direct', 'Rippling Payroll', 'Kaiser Permanente Health']
  }
];

export function getCOAByCode(code: string): ChartOfAccountItem | undefined {
  return STANDARD_COA.find((c) => c.code === code);
}
