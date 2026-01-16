import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { RecordsService, RecordItem } from '../../services/records';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, User } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

// ✅ Excel + PDF libraries
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type SortKey =
  | 'id-asc'
  | 'id-desc'
  | 'lastname-asc'
  | 'lastname-desc'
  | 'format-asc'
  | 'format-desc'
  | 'genre-asc'
  | 'genre-desc';

@Component({
  selector: 'app-records-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './records-list.html',
  styleUrl: './records-list.css',
})
export class RecordsListComponent implements OnInit, OnDestroy {
  records: RecordItem[] = [];
  viewRecords: RecordItem[] = [];

  loading = true;
  error = '';
  apiUrl = environment.apiUrl;

  // search + sort UI state
  search = '';
  sort: SortKey = 'id-asc';

  private routerSub: any;

  constructor(
    private recordsService: RecordsService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  get user(): User | null {
    return this.auth.getCurrentUser();
  }

  get canUpdate(): boolean {
    const role = this.user?.role;
    return role === 'manager' || role === 'admin';
  }

  get canDelete(): boolean {
    return this.user?.role === 'admin';
  }

  ngOnInit(): void {
    this.loadRecords();

    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.urlAfterRedirects === '/records') {
          this.loadRecords();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  async loadRecords(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.records = [];
    this.viewRecords = [];
    this.cdr.detectChanges();

    try {
      const data = await firstValueFrom(
        this.recordsService.getAll().pipe(timeout(5000))
      );

      this.records = data;
      this.applyFilters();
      this.loading = false;
      this.cdr.detectChanges();
    } catch (err: any) {
      console.log('Records FAILED / timed out:', err);

      this.error =
        'Could not load records. Make sure backend is running: http://localhost:3000 (then retry).';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  applyFilters(): void {
    const q = this.search.trim().toLowerCase();

    let filtered = this.records;
    if (q) {
      filtered = this.records.filter((r) => {
        const text = `${r.id} ${r.customerId ?? ''} ${r.customerLastName ?? ''} ${r.format} ${r.genre}`.toLowerCase();
        return text.includes(q);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const aLast = (a.customerLastName ?? '').toLowerCase();
      const bLast = (b.customerLastName ?? '').toLowerCase();
      const aFmt = (a.format ?? '').toLowerCase();
      const bFmt = (b.format ?? '').toLowerCase();
      const aGen = (a.genre ?? '').toLowerCase();
      const bGen = (b.genre ?? '').toLowerCase();

      switch (this.sort) {
        case 'id-asc':
          return a.id - b.id;
        case 'id-desc':
          return b.id - a.id;

        case 'lastname-asc':
          return aLast.localeCompare(bLast);
        case 'lastname-desc':
          return bLast.localeCompare(aLast);

        case 'format-asc':
          return aFmt.localeCompare(bFmt);
        case 'format-desc':
          return bFmt.localeCompare(aFmt);

        case 'genre-asc':
          return aGen.localeCompare(bGen);
        case 'genre-desc':
          return bGen.localeCompare(aGen);

        default:
          return 0;
      }
    });

    this.viewRecords = sorted;
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.search = '';
    this.applyFilters();
  }

  deleteFromList(id: number, title: string): void {
    if (!this.canDelete) return;

    const ok = confirm(`Delete "${title}"? This cannot be undone.`);
    if (!ok) return;

    this.recordsService.delete(id).subscribe({
      next: () => this.loadRecords(),
      error: (err) => {
        console.log('Delete error:', err);
        this.error =
          err?.error?.error || err?.message || 'Failed to delete record';
        this.cdr.detectChanges();
      },
    });
  }

  // ============================================================
  // ✅ EXPORT (Excel + PDF) + Genre row color coding
  // Requirement: export current records (use viewRecords),
  // and color rows by genre (same genre => same background).
  // ============================================================

  private readonly genrePalette = [
    '#FDE68A', // yellow
    '#BFDBFE', // blue
    '#BBF7D0', // green
    '#FBCFE8', // pink
    '#DDD6FE', // purple
    '#FED7AA', // orange
    '#CFFAFE', // cyan
    '#E5E7EB', // gray
  ];

  private buildGenreColorMap(items: RecordItem[]): Map<string, string> {
    const map = new Map<string, string>();
    let i = 0;

    for (const r of items) {
      const g = (r.genre ?? 'Unknown').trim() || 'Unknown';
      if (!map.has(g)) {
        map.set(g, this.genrePalette[i % this.genrePalette.length]);
        i++;
      }
    }
    return map;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }

  private hexToARGB(hex: string): string {
    // XLSX style wants ARGB like "FFRRGGBB"
    return 'FF' + hex.replace('#', '').toUpperCase();
  }

  exportExcel(): void {
    const rows = this.viewRecords;
    if (!rows.length) return;

    const genreColor = this.buildGenreColorMap(rows);

    // Columns match your table: Id, Customer ID, Customer Last Name, Format, Genre
    const data: any[][] = [
      ['Id', 'Customer ID', 'Customer Last Name', 'Format', 'Genre'],
      ...rows.map((r) => [
        r.id,
        r.customerId || '',
        r.customerLastName || '',
        r.format,
        r.genre,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // set column widths
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 16 },
    ];

    // style header row
    for (let c = 0; c < 5; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
      const cell = ws[cellAddr];
      if (!cell) continue;
      cell.s = {
        font: { bold: true },
        alignment: { horizontal: 'center' },
        fill: { patternType: 'solid', fgColor: { rgb: 'FF111827' } },
      };
      // make header text white
      cell.s.font = { bold: true, color: { rgb: 'FFFFFFFF' } };
    }

    // color each data row by genre
    for (let r = 1; r < data.length; r++) {
      const genre = String(data[r][4] ?? 'Unknown').trim() || 'Unknown';
      const bgHex = genreColor.get(genre) ?? '#FFFFFF';
      const argb = this.hexToARGB(bgHex);

      for (let c = 0; c < 5; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell) continue;
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: argb } },
          alignment: { vertical: 'center' },
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records');

    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, 'records.xlsx');
  }

  exportPdf(): void {
    const rows = this.viewRecords;
    if (!rows.length) return;

    const genreColor = this.buildGenreColorMap(rows);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    doc.setFontSize(16);
    doc.text('Records Export', 40, 40);

    const body = rows.map((r) => [
      r.id,
      r.customerId || '',
      r.customerLastName || '',
      r.format,
      r.genre,
    ]);

    autoTable(doc as any, {
      startY: 60,
      head: [['Id', 'Customer ID', 'Customer Last Name', 'Format', 'Genre']],
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [17, 24, 39] }, // dark header
      didParseCell: (data: any) => {
        if (data.section !== 'body') return;

        const genre = String(data.row.raw[4] ?? 'Unknown').trim() || 'Unknown';
        const bgHex = genreColor.get(genre) ?? '#FFFFFF';
        const rgb = this.hexToRgb(bgHex);

        data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
      },
    });

    doc.save('records.pdf');
  }
}
