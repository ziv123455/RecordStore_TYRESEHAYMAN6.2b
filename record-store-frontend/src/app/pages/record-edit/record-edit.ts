import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecordsService, RecordItem } from '../../services/records';
import { Subscription, timeout, forkJoin } from 'rxjs';

function customerIdPatternValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  const ok = /^[0-9]+[A-Za-z]$/.test(value);
  return ok ? null : { customerIdPattern: true };
}

function numericMinLen8Validator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  const ok = /^[0-9]{8,}$/.test(value);
  return ok ? null : { contactInvalid: true };
}

@Component({
  selector: 'app-record-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './record-edit.html',
  styleUrl: './record-edit.css',
})
export class RecordEditComponent implements OnInit, OnDestroy {
  id = 0;
  record: RecordItem | null = null;

  loading = true;
  saving = false;
  error = '';

  formats: string[] = [];
  genres: string[] = [];
  loadingOptions = true;

  private routeSub?: Subscription;
  private dataSub?: Subscription;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private recordsService: RecordsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      artist: ['', [Validators.required]],
      genre: ['', [Validators.required]],
      format: ['', [Validators.required]],
      releaseYear: ['', [Validators.required]],
      price: ['', [Validators.required]],
      stockQty: ['', [Validators.required]],

      customerId: ['', [Validators.required, customerIdPatternValidator]],
      customerFirstName: ['', [Validators.required]],
      customerLastName: ['', [Validators.required]],
      customerContact: ['', [Validators.required, numericMinLen8Validator]],
      customerEmail: ['', [Validators.required, Validators.email]],
    });
  }

  c(name: string) {
    return this.form.get(name);
  }

  showError(name: string): boolean {
    const ctrl = this.c(name);
    return !!ctrl && ctrl.touched && ctrl.invalid;
  }

  ngOnInit(): void {
    this.loadingOptions = true;
    this.error = '';

    // load both dropdown lists first
    forkJoin({
      formats: this.recordsService.getFormats(),
      genres: this.recordsService.getGenres(),
    }).subscribe({
      next: ({ formats, genres }) => {
        this.formats = formats;
        this.genres = genres;
        this.loadingOptions = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load formats/genres from API';
        this.loadingOptions = false;
        this.cdr.detectChanges();
      },
    });

    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.id = Number(params.get('id'));
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.record = null;
    this.cdr.detectChanges();

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

          this.form.patchValue({
            title: data.title,
            artist: data.artist,
            genre: data.genre,
            format: data.format,
            releaseYear: String(data.releaseYear),
            price: String(data.price),
            stockQty: String(data.stockQty),

            customerId: data.customerId ?? '',
            customerFirstName: data.customerFirstName ?? '',
            customerLastName: data.customerLastName ?? '',
            customerContact: data.customerContact ?? '',
            customerEmail: data.customerEmail ?? '',
          });

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.log('Edit load error:', err);
          this.error = err?.error?.error || err?.message || 'Failed to load record';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  submit(): void {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.record) return;

    this.saving = true;

    const payload: any = {
      ...this.form.value,
      releaseYear: Number(this.form.value.releaseYear),
      price: Number(this.form.value.price),
      stockQty: Number(this.form.value.stockQty),
    };

    this.recordsService.update(this.record.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/records', this.record!.id]);
      },
      error: (err) => {
        console.log('Update error:', err);
        this.error = err?.error?.error || err?.message || 'Failed to update record';
        this.saving = false;
        this.cdr.detectChanges();
      },
    });
  }
}
