import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'documento',
})
export class DocumentoPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    const text = typeof value === 'number' ? value.toString() : String(value).trim();
    const digits = text.replace(/\D/g, '');

    if (!digits) return '-';

    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
