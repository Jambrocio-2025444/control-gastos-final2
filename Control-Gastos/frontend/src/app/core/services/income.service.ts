import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Income, CreateIncomeRequest } from '../models/income.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private readonly API_URL = `${environment.apiUrl}/incomes`;
  private http = inject(HttpClient);

  private incomesSubject = new BehaviorSubject<Income[]>([]);
  incomes$ = this.incomesSubject.asObservable();

  // Fuente única de verdad para el total — el Dashboard se suscribe a esto
  total$: Observable<number> = this.incomes$.pipe(
    map(incomes => incomes.reduce((sum, i) => sum + Number(i.amount), 0))
  );

  totalByType(type: 'fijo' | 'variable' | 'otro'): Observable<number> {
    return this.incomes$.pipe(
      map(incomes => incomes
        .filter(i => i.type === type)
        .reduce((sum, i) => sum + Number(i.amount), 0))
    );
  }

  loadIncomes(): void {
    this.http.get<ApiResponse<Income[]>>(this.API_URL)
      .pipe(map(res => res.data))
      .subscribe(incomes => this.incomesSubject.next(incomes));
  }

  createIncome(data: CreateIncomeRequest): Observable<Income> {
    return this.http.post<ApiResponse<Income>>(this.API_URL, data).pipe(
      map(res => res.data),
      tap(income => {
        this.incomesSubject.next([income, ...this.incomesSubject.value]);
      })
    );
  }

  getCurrentTotal(): number {
  return this.incomesSubject.value.reduce((sum, i) => sum + Number(i.amount), 0);
}

  updateIncome(id: number, data: CreateIncomeRequest): Observable<Income> {
    return this.http.put<ApiResponse<Income>>(`${this.API_URL}/${id}`, data).pipe(
      map(res => res.data),
      tap(updated => {
        const current = this.incomesSubject.value.map(i => i.id === id ? updated : i);
        this.incomesSubject.next(current);
      })
    );
  }

  deleteIncome(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`).pipe(
      map(() => void 0),
      tap(() => {
        const current = this.incomesSubject.value.filter(i => i.id !== id);
        this.incomesSubject.next(current);
      })
    );
  }
}