import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormDesignerService } from '../../services/form-designer.service';
import { FormSchema } from '../../models/form-schema.models';
import { FormPreviewComponent } from './form-preview.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-form-preview-page',
  standalone: true,
  imports: [
    CommonModule,
    FormPreviewComponent,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './form-preview-page.component.html',
  styleUrls: ['./form-preview-page.component.scss']
})
export class FormPreviewPageComponent implements OnInit {
  schema: FormSchema | null = null;
  loading = true;
  error: string | null = null;
  formId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formDesignerService: FormDesignerService
  ) {}

  ngOnInit(): void {
    this.formId = this.route.snapshot.paramMap.get('id') || '';
    if (this.formId) {
      this.loadForm();
    } else {
      this.error = 'Form ID not provided';
      this.loading = false;
    }
  }

  loadForm(): void {
    this.loading = true;
    this.error = null;
    
    this.formDesignerService.loadFormSchema(this.formId).subscribe({
      next: (schema) => {
        this.schema = schema;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load form';
        this.loading = false;
        console.error('Error loading form:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/manage']);
  }

  editForm(): void {
    if (this.schema) {
      this.formDesignerService.updateState({ schema: this.schema });
      this.router.navigate(['/design']);
    }
  }
}
