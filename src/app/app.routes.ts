import { Routes } from '@angular/router';
import { FormDesignerComponent } from './components/form-designer/form-designer.component';
import { FormManagerComponent } from './components/form-manager/form-manager.component';
import { FormPreviewPageComponent } from './components/form-preview/form-preview-page.component';

export const routes: Routes = [
  { path: '', redirectTo: '/manage', pathMatch: 'full' },
  { path: 'manage', component: FormManagerComponent },
  { path: 'design', component: FormDesignerComponent },
  { path: 'preview/:id', component: FormPreviewPageComponent },
  { path: '**', redirectTo: '/manage' }
];
