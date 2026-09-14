import { pool } from '../config/database';
import { Income, CreateIncomeRequest } from '../types';

export class IncomeModel {
  static async findAllByUser(userId: number): Promise<Income[]> {
    const result = await pool.query(
      'SELECT * FROM incomes WHERE user_id = $1 ORDER BY income_date DESC, id DESC',
      [userId]
    );
    return result.rows;
  }

  static async create(userId: number, data: CreateIncomeRequest): Promise<Income> {
    const result = await pool.query(
      `INSERT INTO incomes (user_id, type, amount, description, income_date, period, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, data.type, data.amount, data.description, data.income_date, data.period, data.notes || null]
    );
    return result.rows[0];
  }

  static async findByIdAndUser(id: number, userId: number): Promise<Income | null> {
    const result = await pool.query(
      'SELECT * FROM incomes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  }

  static async update(id: number, userId: number, data: CreateIncomeRequest): Promise<Income | null> {
    const result = await pool.query(
      `UPDATE incomes
       SET type = $1, amount = $2, description = $3, income_date = $4, period = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [data.type, data.amount, data.description, data.income_date, data.period, data.notes || null, id, userId]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM incomes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async existsForUser(userId: number): Promise<boolean> {
    const result = await pool.query('SELECT 1 FROM incomes WHERE user_id = $1 LIMIT 1', [userId]);
    return (result.rowCount ?? 0) > 0;
  }

  static async sumForUser(userId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = $1', 
      [userId]
    );
    return Number(result.rows[0].total);
  }
}