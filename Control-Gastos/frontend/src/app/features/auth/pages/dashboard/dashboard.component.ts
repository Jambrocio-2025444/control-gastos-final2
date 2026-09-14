import { Component, OnInit, inject } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { IncomeService } from '../../../../core/services/income.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { SavingsService } from '../../../../core/services/savings.service';
import { User } from '../../../../core/models/user.model';
import { Income } from '../../../../core/models/income.model';
import { Expense } from '../../../../core/models/expense.model';

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
  private savingsService = inject(SavingsService);

  currentUser: User | null = null;

  totalIncome$ = this.incomeService.total$;
  totalExpenses$ = this.expenseService.total$;
  
  
  totalDebts$ = this.expenseService.totalByClassification('deuda');

  totalDebtForHealth$ = this.expenseService.totalDebtForHealth$;

  debtHealthGoal = 35;


  debtHealthPercent$ = combineLatest([this.totalDebtForHealth$, this.totalIncome$]).pipe(
    map(([debts, income]) => income > 0 ? Math.round((debts / income) * 1000) / 10 : 0)
  );

  salaryCoversDebt$ = combineLatest([this.totalDebtForHealth$, this.totalIncome$]).pipe(
    map(([debts, income]) => debts <= income)
  );


  remainingAfterDebt$ = combineLatest([this.totalIncome$, this.totalDebtForHealth$]).pipe(
    map(([income, debts]) => income - debts)
  );

  totalSaved$ = this.savingsService.totalSaved$;
  activeGoal$ = this.savingsService.activeGoal$;
  savingsProgressPercent$ = this.savingsService.savingsProgressPercent$;

  cashFlow$: Observable<CashFlowWeek[]> = combineLatest([
    this.incomeService.incomes$,
    this.expenseService.expenses$,
  ]).pipe(
    map(([incomes, expenses]) => this.buildCashFlowByType(incomes, expenses))
  );

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.incomeService.loadIncomes();
    this.expenseService.loadExpenses();
    this.savingsService.loadGoals();
  }

  private sumBy<T>(items: T[], amountOf: (item: T) => number): number {
    return items.reduce((sum, item) => sum + amountOf(item), 0);
  }

  private buildCashFlowByType(incomes: Income[], expenses: Expense[]): CashFlowWeek[] {
    const incomeFijo = this.sumBy(incomes.filter(i => i.type === 'fijo'), i => Number(i.amount));
    const incomeVariable = this.sumBy(incomes.filter(i => i.type === 'variable'), i => Number(i.amount));
    const incomeOtro = this.sumBy(incomes.filter(i => i.type === 'otro'), i => Number(i.amount));

    const expenseFijo = this.sumBy(expenses.filter(e => e.classification === 'fijo'), e => Number(e.amount));
    const expenseVariable = this.sumBy(expenses.filter(e => e.classification === 'variable'), e => Number(e.amount));
    const expenseDeuda = this.sumBy(expenses.filter(e => e.classification === 'deuda'), e => Number(e.amount));

    const pairs = [
      { label: 'Fijos', ingresos: incomeFijo, egresos: expenseFijo },
      { label: 'Variables', ingresos: incomeVariable, egresos: expenseVariable },
      { label: 'Otros', ingresos: incomeOtro, egresos: expenseDeuda },
    ];

    const maxValue = Math.max(...pairs.flatMap(p => [p.ingresos, p.egresos]), 1);

    return pairs.map(p => ({
      label: p.label,
      ingresos: Math.round((p.ingresos / maxValue) * 100),
      egresos: Math.round((p.egresos / maxValue) * 100),
    }));
  }
}