import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Expense, CreateExpenseRequest, ExpenseClassification } from '../models/expense.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly API_URL = `${environment.apiUrl}/expenses`;
  private http = inject(HttpClient);

  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();

  total$: Observable<number> = this.expenses$.pipe(
    map(expenses => expenses.reduce((sum, e) => sum + Number(e.amount), 0))
  );

  totalByClassification(classification: ExpenseClassification): Observable<number> {
    return this.expenses$.pipe(
      map(expenses => expenses
        .filter(e => e.classification === classification)
        .reduce((sum, e) => sum + Number(e.amount), 0))
    );
  }

  loadExpenses(): void {
    this.http.get<ApiResponse<Expense[]>>(this.API_URL)
      .pipe(map(res => res.data))
      .subscribe(expenses => this.expensesSubject.next(expenses));
  }

  createExpense(data: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<ApiResponse<Expense>>(this.API_URL, data).pipe(
      map(res => res.data),
      tap(expense => this.expensesSubject.next([expense, ...this.expensesSubject.value]))
    );
  }

  updateExpense(id: number, data: CreateExpenseRequest): Observable<Expense> {
    return this.http.put<ApiResponse<Expense>>(`${this.API_URL}/${id}`, data).pipe(
      map(res => res.data),
      tap(updated => {
        const current = this.expensesSubject.value.map(e => e.id === id ? updated : e);
        this.expensesSubject.next(current);
      })
    );
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        const current = this.expensesSubject.value.filter(e => e.id !== id);
        this.expensesSubject.next(current);
      })
    );
  }
}