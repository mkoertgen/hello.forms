import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Core modules that are used everywhere
const CORE_MODULES = [
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
];

// Form-specific modules (only import when needed)
export const FORM_MODULES = [
  MatFormFieldModule,
  MatInputModule,
];

// Designer-specific modules
export const DESIGNER_MODULES = [
  // Will be imported only in designer component
];

@NgModule({
  exports: CORE_MODULES
})
export class SharedMaterialModule { }
