import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { DashboardComponent } from './features/auth/pages/dashboard/dashboard.component';
import { SessionExpiredModalComponent } from './features/auth/pages/session-expired/session-expired.component';
import { SidebarComponent } from './features/auth/pages/sidebar/sidebar.component';
import { IncomeComponent } from './features/auth/pages/income/income.component';
import { ExpenseComponent } from './features/auth/pages/expense/expense.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    SessionExpiredModalComponent,
    SidebarComponent,
    IncomeComponent,
    ExpenseComponent
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AppRoutingModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}