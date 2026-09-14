import { Router } from 'express';
import { SavingsController } from '../controllers/savings.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', SavingsController.list);
router.post('/', SavingsController.create);
router.put('/:id/contribute', SavingsController.contribute);
router.delete('/:id', SavingsController.remove);

export default router;