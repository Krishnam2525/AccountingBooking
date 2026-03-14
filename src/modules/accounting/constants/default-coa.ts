import { AccountType } from '@prisma/client';

export const DEFAULT_CHART_OF_ACCOUNTS = [
  // ASSETS (1000-1999)
  { code: '1000', name: 'Cash and Cash Equivalents', type: AccountType.ASSET, isControl: false },
  { code: '1200', name: 'Accounts Receivable', type: AccountType.ASSET, isControl: true },
  { code: '1400', name: 'Inventory Asset', type: AccountType.ASSET, isControl: true },
  { code: '1500', name: 'Prepaid Expenses', type: AccountType.ASSET, isControl: false },
  { code: '1700', name: 'Fixed Assets', type: AccountType.ASSET, isControl: false },
  { code: '1750', name: 'Accumulated Depreciation', type: AccountType.ASSET, isControl: false },

  // LIABILITIES (2000-2999)
  { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, isControl: true },
  { code: '2100', name: 'Credit Card', type: AccountType.LIABILITY, isControl: false },
  { code: '2200', name: 'Sales Tax Payable', type: AccountType.LIABILITY, isControl: true },
  { code: '2300', name: 'Accrued Payroll', type: AccountType.LIABILITY, isControl: true },
  { code: '2400', name: 'Unearned Revenue', type: AccountType.LIABILITY, isControl: false },
  { code: '2800', name: 'Long-Term Debt', type: AccountType.LIABILITY, isControl: false },

  // EQUITY (3000-3999)
  { code: '3000', name: 'Owner\'s Equity', type: AccountType.EQUITY, isControl: false },
  { code: '3100', name: 'Owner\'s Draw', type: AccountType.EQUITY, isControl: false },
  { code: '3900', name: 'Retained Earnings', type: AccountType.EQUITY, isControl: true },

  // REVENUE (4000-4999)
  { code: '4000', name: 'Sales Revenue', type: AccountType.REVENUE, isControl: false },
  { code: '4100', name: 'Service Revenue', type: AccountType.REVENUE, isControl: false },
  { code: '4200', name: 'Shipping Income', type: AccountType.REVENUE, isControl: false },
  { code: '4900', name: 'Discounts Given', type: AccountType.REVENUE, isControl: false }, // Contra-revenue

  // COST OF GOODS SOLD (5000-5999)
  { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, isControl: false },
  { code: '5100', name: 'Merchant Fees', type: AccountType.EXPENSE, isControl: false },
  { code: '5200', name: 'Shipping & Freight Costs', type: AccountType.EXPENSE, isControl: false },

  // OPERATING EXPENSES (6000-7999)
  { code: '6000', name: 'Advertising & Marketing', type: AccountType.EXPENSE, isControl: false },
  { code: '6100', name: 'Bank Charges & Fees', type: AccountType.EXPENSE, isControl: false },
  { code: '6200', name: 'IT & Software Subscriptions', type: AccountType.EXPENSE, isControl: false },
  { code: '6300', name: 'Legal & Professional Fees', type: AccountType.EXPENSE, isControl: false },
  { code: '6400', name: 'Office Supplies', type: AccountType.EXPENSE, isControl: false },
  { code: '6500', name: 'Rent & Lease', type: AccountType.EXPENSE, isControl: false },
  { code: '6600', name: 'Repairs & Maintenance', type: AccountType.EXPENSE, isControl: false },
  { code: '6700', name: 'Travel & Meals', type: AccountType.EXPENSE, isControl: false },
  { code: '6800', name: 'Utilities', type: AccountType.EXPENSE, isControl: false },
  { code: '7000', name: 'Payroll Expenses', type: AccountType.EXPENSE, isControl: false },
  { code: '7100', name: 'Payroll Taxes', type: AccountType.EXPENSE, isControl: false },

  // OTHER INCOME/EXPENSE (8000-9999)
  { code: '8000', name: 'Interest Income', type: AccountType.REVENUE, isControl: false },
  { code: '9000', name: 'Interest Expense', type: AccountType.EXPENSE, isControl: false },
  { code: '9100', name: 'Depreciation Expense', type: AccountType.EXPENSE, isControl: false },
];
