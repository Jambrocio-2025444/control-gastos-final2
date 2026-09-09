export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export interface Income {
  id: number;
  user_id: number;
  type: 'fijo' | 'variable' | 'otro';
  amount: number;
  description: string;
  income_date: string;
  period: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeRequest {
  type: 'fijo' | 'variable' | 'otro';
  amount: number;
  description: string;
  income_date: string;
  period: string;
  notes?: string;
}

export interface Expense {
  id: number;
  user_id: number;
  classification: 'fijo' | 'variable' | 'deuda';
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  period: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  classification: 'fijo' | 'variable' | 'deuda';
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  period: string;
  notes?: string;
}