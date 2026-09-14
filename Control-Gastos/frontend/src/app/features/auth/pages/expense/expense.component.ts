import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService } from '../../../../core/services/expense.service';
import { IncomeService } from '../../../../core/services/income.service';
import { BalanceService } from '../../../../core/services/balance.service';
import { Expense, ExpenseClassification, EXPENSE_CATEGORIES, CLASSIFICATION_LABELS } from '../../../../core/models/expense.model';
import { Observable, map } from 'rxjs';
import { maxDecimalsValidator } from '../../../../core/validators/decimal.validator';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  standalone: false
})
export class ExpenseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private incomeService = inject(IncomeService);
  private balanceService = inject(BalanceService);
  private editingOriginalAmount = 0;

  expenses$: Observable<Expense[]> = this.expenseService.expenses$;
  totalFijos$ = this.expenseService.totalByClassification('fijo');
  totalVariables$ = this.expenseService.totalByClassification('variable');
  totalDeudas$ = this.expenseService.totalByClassification('deuda');
  hasIncomes$ = this.incomeService.incomes$.pipe(map(list => list.length > 0));
  availableBalance$ = this.balanceService.availableBalance$;

  editingId: number | null = null;
  errorMessage = '';
  isSaving = false;

  categoryOptions: string[] = EXPENSE_CATEGORIES['fijo'];

  form: FormGroup = this.fb.group({
    classification: ['fijo', Validators.required],
    category: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(1.00), Validators.max(9999999999.99), maxDecimalsValidator(2)]],
    description: ['', Validators.required],
    expense_date: ['', Validators.required],
    period: ['mes', Validators.required],
    notes: [''],
    include_in_debt_health: [true],
  });

  ngOnInit(): void {
    this.expenseService.loadExpenses();
    this.incomeService.loadIncomes();
    this.categoryOptions = EXPENSE_CATEGORIES[this.form.value.classification as ExpenseClassification];
  }

  get f() { return this.form.controls; }

  onClassificationChange(): void {
    const classification = this.form.value.classification as ExpenseClassification;
    this.categoryOptions = EXPENSE_CATEGORIES[classification];
    this.form.patchValue({ category: '' });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value;
    const newAmount = Number(payload.amount);

    const currentIncome = this.incomeService.getCurrentTotal();
    const currentExpenses = this.expenseService.getCurrentTotal();
    const projectedExpenses = currentExpenses - this.editingOriginalAmount + newAmount;
    const available = this.balanceService.getCurrentAvailableBalance() + this.editingOriginalAmount;

    if (projectedExpenses > currentIncome) {
      this.errorMessage = `Fondos insuficientes. Saldo disponible: Q ${available.toFixed(2)}.`;
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const request$ = this.editingId
      ? this.expenseService.updateExpense(this.editingId, payload)
      : this.expenseService.createExpense(payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.resetForm();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al guardar el egreso.';
      }
    });
  }

  editExpense(expense: Expense): void {
    this.editingId = expense.id;
    this.editingOriginalAmount = Number(expense.amount);
    this.categoryOptions = EXPENSE_CATEGORIES[expense.classification];
    this.form.patchValue({
      classification: expense.classification,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expense_date.substring(0, 10),
      period: expense.period,
      notes: expense.notes ?? '',
      include_in_debt_health: expense.include_in_debt_health,
    });
  }

  deleteExpense(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este egreso?')) return;
    this.expenseService.deleteExpense(id).subscribe();
  }

  resetForm(): void {
    this.editingId = null;
    this.editingOriginalAmount = 0;
    this.categoryOptions = EXPENSE_CATEGORIES['fijo'];
    this.form.reset({ classification: 'fijo', category: '', period: 'mes', include_in_debt_health: true });
  }

  classificationLabel(classification: ExpenseClassification): string {
    return CLASSIFICATION_LABELS[classification];
  }

  readonly maxDate = new Date().toISOString().substring(0, 10);
}