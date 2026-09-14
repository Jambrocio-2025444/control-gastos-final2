import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Ruta pública: login
router.post('/login', AuthController.login); router.post('/google', AuthController.google);


router.get('/me', authMiddleware, AuthController.me);

router.get('/ping', authMiddleware, AuthController.ping);

export default router;