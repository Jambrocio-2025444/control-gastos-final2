import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, merge, fromEvent, throttleTime } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, LoginResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public sessionExpired$ = new BehaviorSubject<boolean>(false);

  private logoutTimer: ReturnType<typeof setTimeout> | null = null;


  private readonly ACTIVITY_THROTTLE_MS = 30_000;

  constructor() {
    this.loadStoredAuth();
    this.listenForActivity();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user_data');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.scheduleAutoLogout(token);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        map(response => response.data),
        tap(data => {
          console.log(`Respuesta del login`, data)
          if (data.token) {
            localStorage.setItem('access_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));
            this.currentUserSubject.next(data.user);
            this.scheduleAutoLogout(data.token);
          }
        })
      );
  }


  logout(): void {
    this.clearSession();
    this.sessionExpired$.next(false);
    this.router.navigate(['/login']);
  }


  notifySessionExpired(): void {
    if (!this.currentUserSubject.value) {
    return;
  }
  this.clearSession();
  this.sessionExpired$.next(true);
  }

  dismissSessionExpired(): void {
    this.sessionExpired$.next(false);
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }


  updateToken(newToken: string): void {
    localStorage.setItem('access_token', newToken);
    this.scheduleAutoLogout(newToken);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private scheduleAutoLogout(token: string): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }

    const expiresAt = this.getTokenExpiration(token);
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt - Date.now();

    if (msUntilExpiry <= 0) {
      this.checkExpiryAndLogout();
      return;
    }

    this.logoutTimer = setTimeout(() => this.checkExpiryAndLogout(), msUntilExpiry);
  }


  private checkExpiryAndLogout(): void {
    const currentToken = this.getToken();
    if (!currentToken) return;

    const expiresAt = this.getTokenExpiration(currentToken);
    if (expiresAt && expiresAt > Date.now()) {
      this.scheduleAutoLogout(currentToken);
      return;
    }

    this.notifySessionExpired();
  }

  private getTokenExpiration(token: string): number | null {
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  loginWithGoogle(credential: string): Observable<LoginResponse> {
  return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/auth/google`, { credential }).pipe(
    map(response => response.data),
    tap(data => {
      if (data.token) {
        localStorage.setItem('access_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        this.currentUserSubject.next(data.user);
        this.scheduleAutoLogout(data.token);
      }
    })
  );
}


  private listenForActivity(): void {
    const activity$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'click'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart'),
    );

    activity$.pipe(throttleTime(this.ACTIVITY_THROTTLE_MS)).subscribe(() => {
      this.pingActivity();
    });
  }


  private pingActivity(): void {
    if (!this.isAuthenticated()) return;

    this.http.get(`${this.API_URL}/auth/ping`).subscribe({
      error: () => {

      },
    });
  }
}