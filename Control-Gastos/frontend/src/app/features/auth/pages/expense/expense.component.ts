import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService } from '../../../../core/services/expense.service';
import {Expense, ExpenseClassification, EXPENSE_CATEGORIES, CLASSIFICATION_LABELS} from '../../../../core/models/expense.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  standalone: false
})
export class ExpenseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);

  expenses$: Observable<Expense[]> = this.expenseService.expenses$;
  totalFijos$ = this.expenseService.totalByClassification('fijo');
  totalVariables$ = this.expenseService.totalByClassification('variable');
  totalDeudas$ = this.expenseService.totalByClassification('deuda');

  editingId: number | null = null;
  errorMessage = '';
  isSaving = false;

  categoryOptions: string[] = EXPENSE_CATEGORIES['fijo'];

  form: FormGroup = this.fb.group({
    classification: ['fijo', Validators.required],
    category: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(0.01), Validators.max(9999999999.99)]],
    description: ['', Validators.required],
    expense_date: ['', Validators.required],
    period: ['mes', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.expenseService.loadExpenses();
    this.categoryOptions = EXPENSE_CATEGORIES[this.form.value.classification as ExpenseClassification];
  }

  get f() { return this.form.controls; }

  onClassificationChange(): void {
    const classification = this.form.value.classification as ExpenseClassification;
    this.categoryOptions = EXPENSE_CATEGORIES[classification];
    this.form.patchValue({ category: '' }); // la categoría anterior ya no aplica
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    const payload = this.form.value;

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
    this.categoryOptions = EXPENSE_CATEGORIES[expense.classification];
    this.form.patchValue({
      classification: expense.classification,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expense_date.substring(0, 10),
      period: expense.period,
      notes: expense.notes ?? '',
    });
  }

  deleteExpense(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este egreso?')) return;
    this.expenseService.deleteExpense(id).subscribe();
  }

  resetForm(): void {
    this.editingId = null;
    this.categoryOptions = EXPENSE_CATEGORIES['fijo'];
    this.form.reset({ classification: 'fijo', category: '', period: 'mes' });
  }

  classificationLabel(classification: ExpenseClassification): string {
    return CLASSIFICATION_LABELS[classification];
  }
}