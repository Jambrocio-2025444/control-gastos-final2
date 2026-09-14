import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { IncomeService } from './income.service';
import { ExpenseService } from './expense.service';
import { SavingsService } from './savings.service';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);
  private savingsService = inject(SavingsService);


  availableBalance$: Observable<number> = combineLatest([
    this.incomeService.total$,
    this.expenseService.total$,
    this.savingsService.totalSaved$,
  ]).pipe(
    map(([income, expenses, saved]) => income - expenses - saved)
  );

  getCurrentAvailableBalance(): number {
    const income = this.incomeService.getCurrentTotal();
    const expenses = this.expenseService.getCurrentTotal();
    const saved = this.savingsService.getCurrentTotalSaved();
    return income - expenses - saved;
  }
}