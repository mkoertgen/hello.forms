import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <mat-icon>build</mat-icon>
      <span>Hello Forms - Form Designer</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/designer">
        <mat-icon>design_services</mat-icon>
        Designer
      </button>
    </mat-toolbar>
    
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    
    main {
      height: calc(100vh - 64px);
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  title = 'hello-forms';
}
