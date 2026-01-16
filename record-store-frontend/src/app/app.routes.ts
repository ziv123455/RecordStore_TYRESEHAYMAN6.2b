import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RecordsListComponent } from './pages/records-list/records-list';
import { RecordDetailsComponent } from './pages/record-details/record-details';
import { RecordAddComponent } from './pages/record-add/record-add';
import { RecordEditComponent } from './pages/record-edit/record-edit';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'records', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  { path: 'records', component: RecordsListComponent, canActivate: [authGuard] },

  // clerk/manager/admin can add
  {
    path: 'records/new',
    component: RecordAddComponent,
    canActivate: [authGuard, roleGuard(['clerk', 'manager', 'admin'])],
  },

  // manager/admin can edit
  {
    path: 'records/:id/edit',
    component: RecordEditComponent,
    canActivate: [authGuard, roleGuard(['manager', 'admin'])],
  },

  { path: 'records/:id', component: RecordDetailsComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'records' },
];
