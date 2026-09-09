import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

interface NavItem {
  label: string;
  icon: 'bar-chart' | 'wallet' | 'piggy-bank';
  route: string | null;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: false
})
export class SidebarComponent {
  private authService = inject(AuthService);
  currentUser: User | null = this.authService.getCurrentUser();

  navItems: NavItem[] = [
    { label: 'Resumen', icon: 'bar-chart', route: '/dashboard' },
    { label: 'ingrese sus ingresos', icon: 'wallet', route: '/income' },
    { label: 'Ingrese sus egresos', icon: 'bar-chart', route: '/expenses' },
    { label: 'Metas de ahorro', icon: 'piggy-bank', route: null },
  ];

  get roleLabel(): string {
    return this.currentUser?.role === 'admin' ? 'Administrador' : 'Usuario';
  }

  get userInitials(): string {
    return (this.currentUser?.username ?? '').slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}