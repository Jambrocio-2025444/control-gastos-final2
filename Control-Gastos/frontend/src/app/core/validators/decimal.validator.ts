import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxDecimalsValidator(maxDecimals: number = 2): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }
    const decimalPart = String(control.value).split('.')[1];
    if (decimalPart && decimalPart.length > maxDecimals) {
      return { maxDecimals: { max: maxDecimals } };
    }
    return null;
  };
}