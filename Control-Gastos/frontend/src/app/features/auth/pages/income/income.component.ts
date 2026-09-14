import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IncomeService } from '../../../../core/services/income.service';
import { Income, IncomeType } from '../../../../core/models/income.model';
import { maxDecimalsValidator } from '../../../../core/validators/decimal.validator';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  standalone: false
})
export class IncomeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private incomeService = inject(IncomeService);

  incomes$: Observable<Income[]> = this.incomeService.incomes$;
  totalFijos$ = this.incomeService.totalByType('fijo');
  totalVariables$ = this.incomeService.totalByType('variable');
  totalOtros$ = this.incomeService.totalByType('otro');

  editingId: number | null = null;
  errorMessage = '';
  isSaving = false;

  form: FormGroup = this.fb.group({
    type: ['fijo', Validators.required],
    amount: [null, [Validators.required, Validators.min(1.00), Validators.max(9999999999.99), maxDecimalsValidator(2)]],
    description: ['', Validators.required],
    income_date: ['', Validators.required],
    period: ['mes', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.incomeService.loadIncomes();
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  this.isSaving = true;
  this.errorMessage = '';
  const payload = this.form.value;

    const request$ = this.editingId
      ? this.incomeService.updateIncome(this.editingId, payload)
      : this.incomeService.createIncome(payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.resetForm();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al guardar el ingreso.';
      }
    });
  }

  editIncome(income: Income): void {
    this.editingId = income.id;
    this.form.patchValue({
      type: income.type,
      amount: income.amount,
      description: income.description,
      income_date: income.income_date.substring(0, 10),
      period: income.period,
      notes: income.notes ?? '',
    });
  }

  deleteIncome(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este ingreso?')) return;
    this.incomeService.deleteIncome(id).subscribe();
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ type: 'fijo', period: 'mes' });
  }

  typeLabel(type: IncomeType): string {
    return type === 'fijo' ? 'Fijo' : type === 'variable' ? 'Variable' : 'Otro';
  }

  readonly maxDate = new Date().toISOString().substring(0, 10);
}