import { Request, Response } from 'express';
import { SavingsModel } from '../models/savings.model';
import { IncomeModel } from '../models/income.model';
import { ExpenseModel } from '../models/expense.model';
import { CreateSavingsGoalRequest } from '../types';

function hasValidDecimals(amount: any, maxDecimals = 2): boolean {
  const decimalPart = String(amount).split('.')[1];
  return !decimalPart || decimalPart.length <= maxDecimals;
}

function validateAmount(amount: any, label: string): string | null {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${label} debe ser un valor numérico.`;
  }
  if (Number(amount) < 1) {
    return `${label} debe ser mayor que cero.`;
  }
  if (Number(amount) > 9999999999.99) {
    return `${label} no puede tener más de 10 dígitos enteros.`;
  }
  if (!hasValidDecimals(amount)) {
    return `${label} solo puede tener hasta 2 decimales.`;
  }
  return null;
}

async function getAvailableForSavings(userId: number): Promise<number> {
  const totalIncome = await IncomeModel.sumForUser(userId);
  const totalExpenses = await ExpenseModel.sumForUser(userId);
  return totalIncome - totalExpenses;
}

export class SavingsController {
  static async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const goals = await SavingsModel.findAllByUser(userId);
      return res.json({ success: true, data: goals });
    } catch (error) {
      console.error('Error al listar metas de ahorro:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const body: CreateSavingsGoalRequest = req.body;

      const activeGoal = await SavingsModel.findActiveForUser(userId);
      if (activeGoal) {
        return res.status(400).json({
          success: false,
          message: `Ya tienes una meta activa (${activeGoal.name}). Debes completarla antes de registrar una nueva.`
        });
      }

      if (!body.name || !String(body.name).trim()) {
        return res.status(400).json({ success: false, message: 'Debes seleccionar el nombre de la meta.' });
      }

      const targetError = validateAmount(body.target_amount, 'El monto objetivo');
      if (targetError) {
        return res.status(400).json({ success: false, message: targetError });
      }

      const initialError = validateAmount(body.initial_amount, 'El aporte inicial');
      if (initialError) {
        return res.status(400).json({ success: false, message: initialError });
      }

      if (Number(body.initial_amount) > Number(body.target_amount)) {
        return res.status(400).json({
          success: false,
          message: `El aporte inicial no puede superar el monto objetivo (Q ${Number(body.target_amount).toFixed(2)}).`
        });
      }

      const available = await getAvailableForSavings(userId);
      if (Number(body.initial_amount) > available) {
        return res.status(400).json({
          success: false,
          message: `Fondos insuficientes. Saldo disponible: Q ${available.toFixed(2)}.`
        });
      }

      const goal = await SavingsModel.create(userId, body);

      const initialAmount = Number(body.initial_amount);
      if (initialAmount > 0) {
        try {
          await ExpenseModel.create(userId, {
            category: 'Ahorro',
            amount: initialAmount,
            description: `Aporte inicial - ${body.name}`,
            date: new Date().toISOString().split('T')[0],
            period: 'Mensual'
          } as any);
        } catch (err) {
          console.error('Error al registrar aporte inicial como egreso:', err);
        }
      }

      return res.status(201).json({ success: true, data: goal });
    } catch (error) {
      console.error('Error al crear meta de ahorro:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async contribute(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id, 10);
      const amount = req.body.amount;

      const goal = await SavingsModel.findByIdAndUser(id, userId);
      if (!goal) {
        return res.status(404).json({ success: false, message: 'Meta de ahorro no encontrada' });
      }
      if (goal.status === 'completada') {
        return res.status(400).json({ success: false, message: 'Esta meta ya fue completada.' });
      }

      const amountError = validateAmount(amount, 'El abono');
      if (amountError) {
        return res.status(400).json({ success: false, message: amountError });
      }

      const remaining = Number(goal.target_amount) - Number(goal.current_amount);
      if (Number(amount) > remaining) {
        return res.status(400).json({
          success: false,
          message: `El abono supera lo que falta para completar la meta. Puedes abonar hasta Q ${remaining.toFixed(2)}.`
        });
      }

      const available = await getAvailableForSavings(userId);
      if (Number(amount) > available) {
        return res.status(400).json({
          success: false,
          message: `Fondos insuficientes. Saldo disponible: Q ${available.toFixed(2)}.`
        });
      }

      const updated = await SavingsModel.contribute(id, userId, Number(amount));

      try {
        await ExpenseModel.create(userId, {
          category: 'Ahorro',
          amount: Number(amount),
          description: `Abono a meta - ${goal.name}`,
          date: new Date().toISOString().split('T')[0],
          period: 'Mensual'
        } as any);
      } catch (err) {
        console.error('Error al registrar abono como egreso:', err);
      }

      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error al abonar a la meta de ahorro:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id, 10);

      const deleted = await SavingsModel.delete(id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Meta de ahorro no encontrada o ya completada' });
      }
      return res.json({ success: true, message: 'Meta de ahorro eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar meta de ahorro:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}