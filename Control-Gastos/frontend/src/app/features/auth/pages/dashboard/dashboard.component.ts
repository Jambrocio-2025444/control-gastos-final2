import { Component, OnInit, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { IncomeService } from '../../../../core/services/income.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { User } from '../../../../core/models/user.model';

interface CashFlowWeek {
  label: string;
  ingresos: number;
  egresos: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);

  currentUser: User | null = null;

  totalIncome$ = this.incomeService.total$;
  totalExpenses$ = this.expenseService.total$;
  totalDebts$ = this.expenseService.totalByClassification('deuda');

  debtHealthGoal = 35;

  debtHealthPercent$ = combineLatest([this.totalDebts$, this.totalIncome$]).pipe(
    map(([debts, income]) => income > 0 ? Math.round((debts / income) * 1000) / 10 : 0)
  );

  salaryCoversDebt$ = combineLatest([this.totalDebts$, this.totalIncome$]).pipe(
    map(([debts, income]) => debts <= income)
  );

  remainingAfterDebt$ = combineLatest([this.totalIncome$, this.totalDebts$]).pipe(
    map(([income, debts]) => income - debts)
  );

  // Ahorros sigue siendo mock hasta construir ese módulo
  savingsAmount = 'Q 1,680';
  savingsProgressPercent = 40;

  cashFlow: CashFlowWeek[] = [
    { label: 'Sem 1', ingresos: 55, egresos: 30 },
    { label: 'Sem 2', ingresos: 85, egresos: 65 },
    { label: 'Sem 3', ingresos: 70, egresos: 80 },
    { label: 'Sem 4', ingresos: 100, egresos: 60 },
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.incomeService.loadIncomes();
    this.expenseService.loadExpenses();
  }
}