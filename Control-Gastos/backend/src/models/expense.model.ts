import { pool } from '../config/database';
import { Expense, CreateExpenseRequest } from '../types';

export class ExpenseModel {
  static async findAllByUser(userId: number): Promise<Expense[]> {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY expense_date DESC, id DESC',
      [userId]
    );
    return result.rows;
  }

  static async create(userId: number, data: CreateExpenseRequest): Promise<Expense> {
    const result = await pool.query(
      `INSERT INTO expenses (user_id, classification, category, amount, description, expense_date, period, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, data.classification, data.category, data.amount, data.description, data.expense_date, data.period, data.notes || null]
    );
    return result.rows[0];
  }

  static async findByIdAndUser(id: number, userId: number): Promise<Expense | null> {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] || null;
  }

  static async update(id: number, userId: number, data: CreateExpenseRequest): Promise<Expense | null> {
    const result = await pool.query(
      `UPDATE expenses
       SET classification = $1, category = $2, amount = $3, description = $4, expense_date = $5, period = $6, notes = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [data.classification, data.category, data.amount, data.description, data.expense_date, data.period, data.notes || null, id, userId]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}