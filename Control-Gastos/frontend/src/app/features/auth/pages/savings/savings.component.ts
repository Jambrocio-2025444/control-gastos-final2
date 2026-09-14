import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { SavingsService } from '../../../../core/services/savings.service';
import { IncomeService } from '../../../../core/services/income.service';
import { ExpenseService } from '../../../../core/services/expense.service';
import { SavingsGoal, CreateSavingsGoalRequest, SAVINGS_GOAL_NAMES } from '../../../../core/models/savings.model';
import { maxDecimalsValidator } from '../../../../core/validators/decimal.validator';

@Component({
  selector: 'app-savings',
  templateUrl: './savings.component.html',
  standalone: false
})
export class SavingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private savingsService = inject(SavingsService);
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);

  goals$: Observable<SavingsGoal[]> = this.savingsService.goals$;
  activeGoal$ = this.savingsService.activeGoal$;
  activeGoalsCount$ = this.savingsService.activeGoalsCount$;
  completedGoalsCount$ = this.savingsService.completedGoalsCount$;
  totalSaved$ = this.savingsService.totalSaved$;
  availableForSavings$ = this.savingsService.availableForSavings$;

  remainingForActive$: Observable<number> = this.activeGoal$.pipe(
    map(goal => goal ? Number(goal.target_amount) - Number(goal.current_amount) : 0)
  );

  goalNameOptions: string[] = SAVINGS_GOAL_NAMES;

  // Cuando hay una meta activa, el formulario queda "enganchado" a ella (solo se puede abonar).
  editingId: number | null = null;
  errorMessage = '';
  isSaving = false;

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    target_amount: [null, [Validators.required, Validators.min(1.00), Validators.max(9999999999.99), maxDecimalsValidator(2)]],
    amount: [null, [Validators.required, Validators.min(1.00), Validators.max(9999999999.99), maxDecimalsValidator(2)]],
    description: [''],
  });

  ngOnInit(): void {
    this.savingsService.loadGoals();
    this.incomeService.loadIncomes();
    this.expenseService.loadExpenses();

    this.activeGoal$.subscribe(goal => this.syncFormWithActiveGoal(goal));
  }

  get f() { return this.form.controls; }

  private syncFormWithActiveGoal(goal: SavingsGoal | null): void {
    if (goal) {
      this.editingId = goal.id;
      this.form.reset({
        name: goal.name,
        target_amount: goal.target_amount,
        amount: null,
        description: goal.description ?? '',
      });
      this.form.get('name')?.disable({ emitEvent: false });
      this.form.get('target_amount')?.disable({ emitEvent: false });
      this.form.get('description')?.disable({ emitEvent: false });
    } else {
      this.editingId = null;
      this.form.reset({ name: '', target_amount: null, amount: null, description: '' });
      this.form.get('name')?.enable({ emitEvent: false });
      this.form.get('target_amount')?.enable({ emitEvent: false });
      this.form.get('description')?.enable({ emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const amount = Number(raw.amount);

    const currentIncome = this.incomeService.getCurrentTotal();
    const currentExpenses = this.expenseService.getCurrentTotal();
    const currentSaved = this.savingsService.getCurrentTotalSaved();
    const available = currentIncome - currentExpenses - currentSaved;

    if (amount > available) {
      this.errorMessage = `Fondos insuficientes. Saldo disponible: Q ${available.toFixed(2)}.`;
      return;
    }

    this.errorMessage = '';

    if (this.editingId) {
      const activeGoal = this.savingsService.getActiveGoal();
      if (activeGoal) {
        const remaining = Number(activeGoal.target_amount) - Number(activeGoal.current_amount);
        if (amount > remaining) {
          this.errorMessage = `El abono supera lo que falta para completar la meta. Puedes abonar hasta Q ${remaining.toFixed(2)}.`;
          return;
        }
      }

      this.isSaving = true;
      this.savingsService.contribute(this.editingId, { amount }).subscribe({
        next: () => { this.isSaving = false; },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.message || 'Ocurrió un error al registrar el abono.';
        }
      });
      return;
    }

    const targetAmount = Number(raw.target_amount);
    if (amount > targetAmount) {
      this.errorMessage = `El aporte inicial no puede superar el monto objetivo (Q ${targetAmount.toFixed(2)}).`;
      return;
    }

    const payload: CreateSavingsGoalRequest = {
      name: raw.name,
      target_amount: targetAmount,
      initial_amount: amount,
      description: raw.description || undefined,
    };

    this.isSaving = true;
    this.savingsService.createGoal(payload).subscribe({
      next: () => { this.isSaving = false; },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al guardar la meta.';
      }
    });
  }

  focusAmount(goal: SavingsGoal): void {
    if (goal.status !== 'activa') return;
    document.getElementById('savings-amount-input')?.focus();
  }

  deleteGoal(goal: SavingsGoal): void {
    if (goal.status !== 'activa') return;
    if (!confirm('¿Seguro que deseas eliminar esta meta de ahorro?')) return;
    this.savingsService.deleteGoal(goal.id).subscribe();
  }
}