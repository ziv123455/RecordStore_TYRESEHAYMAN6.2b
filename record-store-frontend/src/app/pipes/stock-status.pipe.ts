import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stockStatus',
  standalone: true,
})
export class StockStatusPipe implements PipeTransform {
  transform(stockQty: number | null | undefined): string {
    const qty = Number(stockQty ?? 0);

    if (qty === 0) return 'Out of Stock';
    if (qty >= 1 && qty <= 3) return 'Low Stock';
    return 'In Stock';
  }
}
