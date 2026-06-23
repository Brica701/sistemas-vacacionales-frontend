import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { PanelEmpleadoComponent } from './components/panel-empleado/panel-empleado';
import { PanelAdminComponent } from './components/panel-admin/panel-admin';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'empleado', component: PanelEmpleadoComponent },
  { path: 'admin', component: PanelAdminComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Si entras a la raíz, te manda al login
  { path: '**', redirectTo: 'login' } // Cualquier ruta rara, al login
];