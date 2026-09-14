import { Request, Response, NextFunction } from 'express';
import { verifyToken, generateToken } from '../config/jwt';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
      return; 
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    (req as any).user = decoded;


    const { iat, exp, ...payload } = decoded;
    const refreshedToken = generateToken(payload);
    res.setHeader('X-New-Token', refreshedToken);

    next(); 
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
    return; 
  }
};


export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado: se requiere rol de administrador',
    });
    return;
  }
  next();
};