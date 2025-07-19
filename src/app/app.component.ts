import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <mat-icon>build</mat-icon>
      <span>Hello Forms</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/manage" routerLinkActive="active">
        <mat-icon>folder</mat-icon>
        Manage
      </button>
      <button mat-button routerLink="/design" routerLinkActive="active">
        <mat-icon>design_services</mat-icon>
        Design
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
    
    .active {
      background-color: rgba(255, 255, 255, 0.1);
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
