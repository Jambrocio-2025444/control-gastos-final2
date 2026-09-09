import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import incomeRoutes from './routes/income.routes';
import expenseRoutes from './routes/expense.routes';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/incomes', incomeRoutes)
app.use('/api/expenses', expenseRoutes);

export default app;