import { Routes } from '@angular/router';
import { FormDesignerComponent } from './components/form-designer/form-designer.component';
import { FormManagerComponent } from './components/form-manager/form-manager.component';
import { FormPreviewComponent } from './components/form-preview/form-preview.component';

export const routes: Routes = [
  { path: '', redirectTo: '/manage', pathMatch: 'full' },
  { path: 'manage', component: FormManagerComponent },
  { path: 'design', component: FormDesignerComponent },
  { path: 'preview/:id', component: FormPreviewComponent },
  { path: '**', redirectTo: '/manage' }
];
