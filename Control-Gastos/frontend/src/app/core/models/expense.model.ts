export type ExpenseClassification = 'fijo' | 'variable' | 'deuda';

export const EXPENSE_CATEGORIES: Record<ExpenseClassification, string[]> = {
  fijo: ['Alimentos/Mercado', 'Arriendo/Hipoteca', 'Servicios públicos', 'Transporte', 'Otros'],
  variable: ['Salidas', 'Ropa', 'Viajes', 'Regalos', 'Otros'],
  deuda: ['Préstamos', 'Tarjeta de crédito', 'Otras deudas'],
};

export const CLASSIFICATION_LABELS: Record<ExpenseClassification, string> = {
  fijo: 'Fijos o prioritarios',
  variable: 'Variables / 2da prioridad',
  deuda: 'Deudas',
};

export interface Expense {
  id: number;
  user_id: number;
  classification: ExpenseClassification;
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
  classification: ExpenseClassification;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  period: string;
  notes?: string;
}