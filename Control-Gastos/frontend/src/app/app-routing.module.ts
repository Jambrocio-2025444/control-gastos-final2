import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { DashboardComponent } from './features/auth/pages/dashboard/dashboard.component';
import { IncomeComponent } from './features/auth/pages/income/income.component';
import { ExpenseComponent } from './features/auth/pages/expense/expense.component';
import { SavingsComponent } from './features/auth/pages/savings/savings.component'; // <--- 1. Importa el componente

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'income',
    component: IncomeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'expenses', 
    component: ExpenseComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'savings', 
    component: SavingsComponent, 
    canActivate: [AuthGuard] 
  }, // <--- 2. Añade la ruta protegida aquí
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}