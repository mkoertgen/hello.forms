import { Routes } from '@angular/router';
import { FormDesignerComponent } from './components/form-designer/form-designer.component';
import { FormPreviewComponent } from './components/form-preview/form-preview.component';

export const routes: Routes = [
  { path: '', redirectTo: '/designer', pathMatch: 'full' },
  { path: 'designer', component: FormDesignerComponent },
  { path: 'preview/:id', component: FormPreviewComponent },
  { path: '**', redirectTo: '/designer' }
];
