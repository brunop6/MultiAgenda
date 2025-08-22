import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <div class="app-container">
      <mat-sidenav-container class="sidenav-container" *ngIf="currentUser$ | async as user; else loginView">
        <mat-sidenav #drawer class="sidenav" fixedInViewport
                     [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
                     [mode]="(isHandset$ | async) ? 'over' : 'side'"
                     [opened]="false">
          <mat-toolbar class="sidenav-toolbar">Menu</mat-toolbar>
          <mat-nav-list>
            <a mat-list-item routerLink="/calendar" routerLinkActive="active">
              <mat-icon>calendar_today</mat-icon>
              <span>Calendário</span>
            </a>
            <a mat-list-item routerLink="/events" routerLinkActive="active">
              <mat-icon>event</mat-icon>
              <span>Eventos</span>
            </a>
            <a mat-list-item routerLink="/users" routerLinkActive="active">
              <mat-icon>people</mat-icon>
              <span>Usuários</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-list-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>
        
        <mat-sidenav-content>
          <mat-toolbar class="main-toolbar">
            <button
              type="button"
              aria-label="Toggle sidenav"
              mat-icon-button
              (click)="drawer.toggle()">
              <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
            </button>
            <span>Multi Agenda</span>
            <span class="spacer"></span>
            <span class="user-info">
              <mat-icon>account_circle</mat-icon>
              {{ user.name }}
            </span>
          </mat-toolbar>
          
          <main class="main-content">
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <ng-template #loginView>
        <router-outlet></router-outlet>
      </ng-template>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden; // Evitar qualquer rolagem no container principal
    }

    .sidenav-container {
      flex: 1;
      overflow: hidden; // Evitar rolagem dupla
    }

    .sidenav {
      width: 200px; // Reduzido de 250px para 200px
      background: white; // Fundo branco para a área dos itens
      color: #333;
      display: flex;
      flex-direction: column;
    }

    .sidenav-toolbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      flex-shrink: 0; // Impede que o cabeçalho encolha
    }

    .main-toolbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      
      span {
        font-weight: 600;
        font-size: 18px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      
      button {
        color: white;
        
        &:hover {
          background: rgba(255,255,255,0.1);
        }
      }
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      text-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .main-content {
      padding: 0; // Removido padding para dar mais espaço ao calendário
      height: calc(100vh - 64px);
      overflow: hidden; // Remover barra de rolagem do container principal
      background: #f8f9fa;
    }

    .mat-nav-list {
      padding-top: 8px;
      background: white; // Fundo branco explícito
      flex: 1; // Ocupa o espaço restante
      
      .mat-list-item {
        display: flex;
        align-items: center;
        gap: 12px; // Reduzido de 16px para 12px
        color: #333 !important; // Cor escura no fundo branco
        margin: 4px 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: rgba(102, 126, 234, 0.1) !important; // Hover com cor do gradiente
          transform: translateX(4px);
        }
        
        &.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          
          mat-icon {
            color: white !important;
          }
        }
        
        mat-icon {
          color: #667eea !important; // Ícones com cor do gradiente
          width: 20px; // Ícones menores
          height: 20px;
          font-size: 20px;
        }
        
        span {
          font-size: 14px; // Texto menor
        }
      }
    }

    mat-divider {
      background-color: rgba(102, 126, 234, 0.2) !important; // Divider com cor do gradiente
      margin: 8px 16px !important;
    }

    @media (max-width: 768px) {
      .sidenav {
        width: 180px; // Ainda menor em mobile
      }
      
      .main-content {
        padding: 8px;
      }
      
      .user-info span {
        display: none;
      }
      
      .mat-nav-list .mat-list-item span {
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .sidenav {
        width: 160px;
      }
      
      .main-content {
        padding: 4px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  currentUser$: Observable<User | null>;
  
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private authService: AuthService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    // A navegação será controlada pelo AuthGuard
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}

