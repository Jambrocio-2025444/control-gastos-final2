import { Request, Response } from 'express';
import { IncomeModel } from '../models/income.model';
import { CreateIncomeRequest } from '../types';

const VALID_TYPES = ['fijo', 'variable', 'otro'];

function validateIncome(body: any): string | null {
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return 'Debes seleccionar un tipo de ingreso válido (fijo, variable u otro).';
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
  if (new Date(body.income_date) > new Date()) {
  return 'La fecha no puede ser posterior al día de hoy.';
  }if 
  (!body.period || !body.period.trim()) {
    return 'El período es requerido.';
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

export class IncomeController {
  static async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const incomes = await IncomeModel.findAllByUser(userId);
      return res.json({ success: true, data: incomes });
    } catch (error) {
      console.error('Error al listar ingresos:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validationError = validateIncome(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
      
      const userId = (req as any).user.id;
      const data: CreateIncomeRequest = req.body;
      const income = await IncomeModel.create(userId, data);
      return res.status(201).json({ success: true, data: income });
    } catch (error) {
      console.error('Error al crear ingreso:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const validationError = validateIncome(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const userId = (req as any).user.id;
      const id = parseInt(req.params.id, 10);

      const existing = await IncomeModel.findByIdAndUser(id, userId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Ingreso no encontrado' });
      }

      const updated = await IncomeModel.update(id, userId, req.body);
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error al actualizar ingreso:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id, 10);

      const deleted = await IncomeModel.delete(id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Ingreso no encontrado' });
      }

      return res.json({ success: true, message: 'Ingreso eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}