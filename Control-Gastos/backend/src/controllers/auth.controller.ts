import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos',
        });
      }

      const result = await AuthService.login({ username, password });

      if (!result) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }


  static async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const user = await AuthService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error en me:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  static async google(req: Request, res: Response) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Token de Google no proporcionado' });
    }

    const result = await AuthService.loginWithGoogle(credential);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error en login con Google:', error);
    return res.status(401).json({ success: false, message: 'No se pudo verificar la cuenta de Google' });
  }
}

  static async ping(_req: Request, res: Response) {
    return res.json({ success: true });
  }
}