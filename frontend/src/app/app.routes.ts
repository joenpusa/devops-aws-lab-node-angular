import { Routes } from '@angular/router';
import { MaterialListComponent } from './components/material-list/material-list.component';
import { UsersComponent } from './components/users/users.component';

export const routes: Routes = [
  { path: '', redirectTo: 'materials', pathMatch: 'full' },
  { path: 'materials', component: MaterialListComponent },
  { path: 'users', component: UsersComponent },
  { path: '**', redirectTo: 'materials' }
];
