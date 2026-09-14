import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    let authReq = req;

    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(authReq).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          const newToken = event.headers.get('X-New-Token');
          if (newToken && newToken !== this.authService.getToken()) {
            this.authService.updateToken(newToken);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
      
        if (error.status === 401 && token) {
          this.authService.notifySessionExpired();
        }
        return throwError(() => error);
      })
    );
  }
}