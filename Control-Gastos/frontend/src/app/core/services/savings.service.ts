import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, combineLatest } from 'rxjs';
import { SavingsGoal, CreateSavingsGoalRequest, ContributeSavingsRequest } from '../models/savings.model';
import { environment } from '../../../environments/environment';
import { IncomeService } from './income.service';
import { ExpenseService } from './expense.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class SavingsService {
  private readonly API_URL = `${environment.apiUrl}/savings`;
  private http = inject(HttpClient);
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);

  private goalsSubject = new BehaviorSubject<SavingsGoal[]>([]);
  goals$ = this.goalsSubject.asObservable();

  activeGoal$: Observable<SavingsGoal | null> = this.goals$.pipe(
    map(goals => goals.find(g => g.status === 'activa') ?? null)
  );

  activeGoalsCount$: Observable<number> = this.goals$.pipe(
    map(goals => goals.filter(g => g.status === 'activa').length)
  );

  completedGoalsCount$: Observable<number> = this.goals$.pipe(
    map(goals => goals.filter(g => g.status === 'completada').length)
  );

  totalSaved$: Observable<number> = this.goals$.pipe(
    map(goals => goals.reduce((sum, g) => sum + Number(g.current_amount), 0))
  );

  // Calcula el saldo disponible sin depender de BalanceService
  availableForSavings$: Observable<number> = combineLatest([
    this.incomeService.total$,
    this.expenseService.total$,
    this.totalSaved$,
  ]).pipe(
    map(([income, expenses, saved]) => income - expenses - saved)
  );

  savingsProgressPercent$: Observable<number> = combineLatest([this.activeGoal$, this.goals$]).pipe(
    map(([activeGoal, goals]) => {
      if (activeGoal) {
        if (Number(activeGoal.target_amount) <= 0) return 0;
        return Math.min(100, Math.round((Number(activeGoal.current_amount) / Number(activeGoal.target_amount)) * 1000) / 10);
      }
      return goals.length > 0 ? 100 : 0;
    })
  );

  loadGoals(): void {
    this.http.get<ApiResponse<SavingsGoal[]>>(this.API_URL)
      .pipe(map(res => res.data))
      .subscribe(goals => this.goalsSubject.next(goals));
  }

  getCurrentTotalSaved(): number {
    return this.goalsSubject.value.reduce((sum, g) => sum + Number(g.current_amount), 0);
  }

  getActiveGoal(): SavingsGoal | null {
    return this.goalsSubject.value.find(g => g.status === 'activa') ?? null;
  }

  createGoal(data: CreateSavingsGoalRequest): Observable<SavingsGoal> {
    return this.http.post<ApiResponse<SavingsGoal>>(this.API_URL, data).pipe(
      map(res => res.data),
      tap(goal => this.goalsSubject.next([goal, ...this.goalsSubject.value]))
    );
  }

  contribute(id: number, data: ContributeSavingsRequest): Observable<SavingsGoal> {
    return this.http.put<ApiResponse<SavingsGoal>>(`${this.API_URL}/${id}/contribute`, data).pipe(
      map(res => res.data),
      tap(updated => {
        const current = this.goalsSubject.value.map(g => g.id === id ? updated : g);
        this.goalsSubject.next(current);
      })
    );
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        const current = this.goalsSubject.value.filter(g => g.id !== id);
        this.goalsSubject.next(current);
      })
    );
  }
}