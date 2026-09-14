import { pool } from '../config/database';
import { SavingsGoal, CreateSavingsGoalRequest } from '../types';

export class SavingsModel {
  static async findAllByUser(userId: number): Promise<SavingsGoal[]> {
    const result = await pool.query(
      `SELECT * FROM savings_goals WHERE user_id = $1
       ORDER BY (status = 'activa') DESC, created_at DESC, id DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findByIdAndUser(id: number, userId: number): Promise<SavingsGoal | null> {
    const result = await pool.query(
      'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  }

  static async findActiveForUser(userId: number): Promise<SavingsGoal | null> {
    const result = await pool.query(
      `SELECT * FROM savings_goals WHERE user_id = $1 AND status = 'activa' LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  static async sumCurrentForUser(userId: number): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(current_amount), 0) as total FROM savings_goals WHERE user_id = $1`,
      [userId]
    );
    return Number(result.rows[0].total);
  }

  static async sumSavedForUser(userId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COALESCE(SUM(current_amount), 0) as total FROM savings_goals WHERE user_id = $1',
    [userId]
  );
  return Number(result.rows[0].total);
}

  static async create(userId: number, data: CreateSavingsGoalRequest): Promise<SavingsGoal> {
    const isCompleteOnCreation = data.initial_amount >= data.target_amount;
    const result = await pool.query(
      `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, status, description, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        data.name,
        data.target_amount,
        data.initial_amount,
        isCompleteOnCreation ? 'completada' : 'activa',
        data.description || null,
        isCompleteOnCreation ? new Date() : null,
      ]
    );
    return result.rows[0];
  }

  static async contribute(id: number, userId: number, amount: number): Promise<SavingsGoal | null> {
    const goal = await this.findByIdAndUser(id, userId);
    if (!goal) return null;

    const newAmount = Number(goal.current_amount) + amount;
    const isNowComplete = newAmount >= Number(goal.target_amount);

    const result = await pool.query(
      `UPDATE savings_goals
       SET current_amount = $1, status = $2, completed_at = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [
        newAmount,
        isNowComplete ? 'completada' : 'activa',
        isNowComplete ? new Date() : null,
        id,
        userId,
      ]
    );
    return result.rows[0] || null;
  }

  static async updateDescription(id: number, userId: number, description: string): Promise<SavingsGoal | null> {
    const result = await pool.query(
      `UPDATE savings_goals SET description = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [description || null, id, userId]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 AND status = 'activa'`,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}