export type AccountData = {
  id: number;
  name: string;
  type: string;
  institution: string | null;
  color: string;
  creditLimitCents: number | null;
  closingDay: number | null;
  dueDay: number | null;
  createdAt?: Date | string;
};

export type CategoryData = {
  id: number;
  name: string;
  type: string;
  color: string;
  createdAt?: Date | string;
};

export type TransactionWithMeta = {
  id: number;
  groupId: number;
  accountId: number;
  categoryId: number;
  description: string;
  type: string;
  amountCents: number;
  transactionDate: string;
  competencyMonth: string;
  installmentNumber: number;
  installmentTotal: number;
  status: string;
  notes: string | null;
  groupTotalAmountCents: number;
  groupInstallmentCount: number;
  groupFirstDate: string;
  groupNotes: string | null;
  accountName: string;
  accountType: string;
  accountColor: string;
  categoryName: string;
  categoryColor: string;
};

export type SalaryWithMeta = {
  id: number;
  name: string;
  amountCents: number;
  paymentDay: number;
  startMonth: string;
  endMonth: string | null;
  accountId: number;
  categoryId: number;
  status: string;
  notes: string | null;
  accountName: string;
  accountType: string;
  categoryName: string;
  categoryColor: string;
};

export type TrendItem = {
  month: string;
  monthKey: string;
  income: number;
  expense: number;
  balance: number;
};

export type BreakdownItem = {
  name: string;
  value: number;
};

export type FinanceData = {
  mode: "database" | "demo" | "error";
  databaseMessage: string | null;
  selectedMonth: string;
  selectedYear: number;
  accounts: AccountData[];
  categories: CategoryData[];
  salaries: SalaryWithMeta[];
  monthlySalaries: SalaryWithMeta[];
  transactions: TransactionWithMeta[];
  monthlyTransactions: TransactionWithMeta[];
  annualTransactions: TransactionWithMeta[];
  futureTransactions: TransactionWithMeta[];
  metrics: {
    monthlyIncome: number;
    monthlyTransactionIncome: number;
    monthlySalaryIncome: number;
    monthlyExpense: number;
    monthlyBalance: number;
    monthlySavingsRate: number;
    annualIncome: number;
    annualTransactionIncome: number;
    annualSalaryIncome: number;
    annualExpense: number;
    annualBalance: number;
    averageMonthlyExpense: number;
    futureDebt: number;
    creditCardExpense: number;
    bestMonth: TrendItem;
    worstMonth: TrendItem;
  };
  breakdowns: {
    byCategory: BreakdownItem[];
    byAccount: BreakdownItem[];
    annualByCategory: BreakdownItem[];
  };
  annualTrend: TrendItem[];
};

export type FinanceQueryInput = {
  month?: string;
  year?: number;
};
