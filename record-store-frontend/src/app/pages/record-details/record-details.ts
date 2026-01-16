import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecordsService, RecordItem } from '../../services/records';
import { AuthService, User } from '../../services/auth.service';
import { Subscription, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockStatusPipe } from '../../pipes/stock-status.pipe';

@Component({
  selector: 'app-record-details',
  standalone: true,
  imports: [CommonModule, RouterLink, StockStatusPipe],
  templateUrl: './record-details.html',
  styleUrl: './record-details.css',
})
export class RecordDetailsComponent implements OnInit, OnDestroy {
  record: RecordItem | null = null;
  loading = true;
  error = '';

  id = 0;
  apiUrl = environment.apiUrl;

  private routeSub?: Subscription;
  private dataSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private recordsService: RecordsService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get user(): User | null {
    return this.auth.getCurrentUser();
  }

  get canEdit(): boolean {
    const role = this.user?.role;
    return role === 'manager' || role === 'admin';
  }

  get canDelete(): boolean {
    return this.user?.role === 'admin';
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.id = Number(params.get('id'));
      this.loadRecord();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  loadRecord(): void {
    this.loading = true;
    this.error = '';
    this.record = null;

    this.dataSub?.unsubscribe();

    if (!this.id) {
      this.error = 'Invalid record id';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.dataSub = this.recordsService
      .getById(this.id)
      .pipe(timeout(5000))
      .subscribe({
        next: (data) => {
          this.record = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.log('Record details error:', err);
          this.error =
            err?.message ||
            err?.error?.error ||
            'Failed to load record details.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  deleteRecord(): void {
    if (!this.canDelete || !this.record) return;

    const ok = confirm(`Delete "${this.record.title}"? This cannot be undone.`);
    if (!ok) return;

    this.recordsService.delete(this.record.id).subscribe({
      next: () => this.router.navigate(['/records']),
      error: (err) => {
        console.log('Delete error:', err);
        this.error =
          err?.error?.error || err?.message || 'Failed to delete record';
        this.cdr.detectChanges();
      },
    });
  }
}
