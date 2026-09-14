import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';
import { CreateExpenseRequest } from '../types';
import { IncomeModel } from '../models/income.model';
import { SavingsModel } from '../models/savings.model';

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
  if (new Date(body.expense_date) > new Date()) {
    return 'La fecha no puede ser posterior al día de hoy.';
  }
  if (!hasValidDecimals(body.amount)) {
    return 'El monto solo puede tener hasta 2 decimales.';
  }
  return null;
}

function hasValidDecimals(amount: any, maxDecimals = 2): boolean {
  const decimalPart = String(amount).split('.')[1];
  return !decimalPart || decimalPart.length <= maxDecimals;
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
      const userId = (req as any).user.id;

      const hasIncome = await IncomeModel.existsForUser(userId);
      if (!hasIncome) {
        return res.status(400).json({ success: false, message: 'Debes registrar al menos un ingreso antes de poder registrar egresos.' });
      }

      const validationError = validateExpense(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const totalIncome = await IncomeModel.sumForUser(userId);
      const totalExpenses = await ExpenseModel.sumForUser(userId);
      const totalSaved = await SavingsModel.sumSavedForUser(userId);
      const newAmount = Number(req.body.amount);

      if (totalExpenses + newAmount + totalSaved > totalIncome) {
        const available = totalIncome - totalExpenses - totalSaved;
        return res.status(400).json({
          success: false,
          message: `Fondos insuficientes. Saldo disponible: Q ${available.toFixed(2)}.`
        });
      }

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

      const totalIncome = await IncomeModel.sumForUser(userId);
      const totalExpenses = await ExpenseModel.sumForUser(userId);
      const totalSaved = await SavingsModel.sumSavedForUser(userId);
      const newAmount = Number(req.body.amount);
      const projected = totalExpenses - Number(existing.amount) + newAmount + totalSaved;

      if (projected > totalIncome) {
        const available = totalIncome - totalExpenses + Number(existing.amount) - totalSaved;
        return res.status(400).json({
          success: false,
          message: `Fondos insuficientes. Saldo disponible: Q ${available.toFixed(2)}.`
        });
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