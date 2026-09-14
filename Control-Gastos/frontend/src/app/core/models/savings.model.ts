export type SavingsGoalStatus = 'activa' | 'completada';

export const SAVINGS_GOAL_NAMES: string[] = [
  'Fondo de Emergencia',
  'Curso Especialización',
  'Vacaciones',
  'Vivienda',
  'Vehículo',
  'Tecnología',
  'Otro',
];

export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  status: SavingsGoalStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateSavingsGoalRequest {
  name: string;
  target_amount: number;
  initial_amount: number;
  description?: string;
}

export interface ContributeSavingsRequest {
  amount: number;
  description?: string;
}