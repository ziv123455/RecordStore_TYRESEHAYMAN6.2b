import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RecordsService } from '../../services/records';
import { forkJoin } from 'rxjs';

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
  selector: 'app-record-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './record-add.html',
  styleUrl: './record-add.css',
})
export class RecordAddComponent implements OnInit {
  error = '';
  saving = false;

  formats: string[] = [];
  genres: string[] = [];
  loadingOptions = true;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
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

  ngOnInit(): void {
    this.loadingOptions = true;
    this.error = '';

    forkJoin({
      formats: this.recordsService.getFormats(),
      genres: this.recordsService.getGenres(),
    }).subscribe({
      next: ({ formats, genres }) => {
        this.formats = formats;
        this.genres = genres;
        this.loadingOptions = false;

        // optional: set default values if empty so selects show items immediately
        if (!this.form.value.format && this.formats.length) {
          this.form.patchValue({ format: this.formats[0] });
        }
        if (!this.form.value.genre && this.genres.length) {
          this.form.patchValue({ genre: this.genres[0] });
        }

        // force UI refresh so dropdowns render immediately
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load formats/genres from API';
        this.loadingOptions = false;
        this.cdr.detectChanges();
      },
    });
  }

  c(name: string) {
    return this.form.get(name);
  }

  showError(name: string): boolean {
    const ctrl = this.c(name);
    return !!ctrl && ctrl.touched && ctrl.invalid;
  }

  submit(): void {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    const payload: any = {
      ...this.form.value,
      releaseYear: Number(this.form.value.releaseYear),
      price: Number(this.form.value.price),
      stockQty: Number(this.form.value.stockQty),
    };

    this.recordsService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/records']);
      },
      error: (err) => {
        console.log('Add record error:', err);
        this.error = err?.error?.error || err?.message || 'Failed to add record';
        this.saving = false;
        this.cdr.detectChanges();
      },
    });
  }
}
