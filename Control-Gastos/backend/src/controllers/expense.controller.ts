import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { CreateExpenseRequest } from '../types';

const VALID_CLASSIFICATIONS = ['fijo', 'variable', 'deuda'];

function validateExpense(body: any): string | null {
  if (!body.classification || !VALID_CLASSIFICATIONS.includes(body.classification)) {
    return 'Debes seleccionar una clasificación válida (fijo, variable o deuda).';
  }
  if (!body.category || !body.category.trim()) {
    return 'Debes seleccionar una categoría.';
  }
  if (body.amount === undefined || isNaN(Number(body.amount))) {
    return 'El monto debe ser un valor numérico.';
  }
  if (Number(body.amount) <= 0) {
    return 'El monto debe ser mayor que cero.';
  }
  if (!body.description || !body.description.trim()) {
    return 'La descripción es requerida.';
  }
  if (!body.expense_date || isNaN(Date.parse(body.expense_date))) {
    return 'La fecha ingresada no es válida.';
  }
  if (!body.period || !body.period.trim()) {
    return 'El período es requerido.';
  }
  return null;
}

export class ExpenseController {
  static async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const expenses = await ExpenseModel.findAllByUser(userId);
      return res.json({ success: true, data: expenses });
    } catch (error) {
      console.error('Error al listar egresos:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validationError = validateExpense(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
      const userId = (req as any).user.id;
      const data: CreateExpenseRequest = req.body;
      const expense = await ExpenseModel.create(userId, data);
      return res.status(201).json({ success: true, data: expense });
    } catch (error) {
      console.error('Error al crear egreso:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validationError = validateExpense(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id, 10);

      const existing = await ExpenseModel.findByIdAndUser(id, userId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Egreso no encontrado' });
      }

      const updated = await ExpenseModel.update(id, userId, req.body);
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error al actualizar egreso:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id, 10);

      const deleted = await ExpenseModel.delete(id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Egreso no encontrado' });
      }
      return res.json({ success: true, message: 'Egreso eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar egreso:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}