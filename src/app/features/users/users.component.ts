import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule
  ],
  template: `
    <div class="users-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Usuários do Sistema</mat-card-title>
          <mat-card-subtitle>Gerencie os usuários que podem criar eventos</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <mat-list *ngIf="users$ | async as users; else noUsers">
            <mat-list-item *ngFor="let user of users">
              <div class="user-item">
                <div class="user-avatar">
                  <div class="user-color" [style.background-color]="user.color"></div>
                  <mat-icon>person</mat-icon>
                </div>
                
                <div class="user-details">
                  <h3>{{ user.name }}</h3>
                  <p>{{ user.email }}</p>
                  <small>Membro desde {{ formatDate(user.createdAt) }}</small>
                </div>
                
                <div class="user-actions" *ngIf="isCurrentUser(user.id)">
                  <button mat-icon-button (click)="editProfile(user)">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>
          
          <ng-template #noUsers>
            <div class="no-users">
              <mat-icon>people_outline</mat-icon>
              <p>Nenhum usuário encontrado</p>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>

      <!-- Estatísticas -->
      <mat-card class="stats-card">
        <mat-card-header>
          <mat-card-title>Estatísticas</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="stats-grid">
            <div class="stat-item">
              <mat-icon>people</mat-icon>
              <div class="stat-details">
                <h3>{{ (users$ | async)?.length || 0 }}</h3>
                <p>Total de Usuários</p>
              </div>
            </div>
            
            <div class="stat-item">
              <mat-icon>event</mat-icon>
              <div class="stat-details">
                <h3>{{ totalEvents }}</h3>
                <p>Eventos Criados</p>
              </div>
            </div>
            
            <div class="stat-item">
              <mat-icon>share</mat-icon>
              <div class="stat-details">
                <h3>{{ sharedEvents }}</h3>
                <p>Eventos Compartilhados</p>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Informações do Perfil Atual -->
      <mat-card class="profile-card" *ngIf="currentUser$ | async as currentUser">
        <mat-card-header>
          <mat-card-title>Meu Perfil</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="profile-info">
            <div class="profile-avatar">
              <div class="profile-color" [style.background-color]="currentUser.color"></div>
              <mat-icon>account_circle</mat-icon>
            </div>
            
            <div class="profile-details">
              <h2>{{ currentUser.name }}</h2>
              <p>{{ currentUser.email }}</p>
              <small>Cor do perfil: {{ getColorName(currentUser.color) }}</small>
            </div>
          </div>
          
          <div class="profile-actions">
            <button mat-raised-button color="primary" (click)="editProfile(currentUser)">
              <mat-icon>edit</mat-icon>
              Editar Perfil
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 8px 0;
    }

    .user-avatar {
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-color {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      opacity: 0.2;
    }

    .user-avatar mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #666;
    }

    .user-details {
      flex: 1;
    }

    .user-details h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
    }

    .user-details p {
      margin: 0 0 2px 0;
      color: #666;
      font-size: 14px;
    }

    .user-details small {
      color: #999;
      font-size: 12px;
    }

    .user-actions {
      display: flex;
      gap: 8px;
    }

    .no-users {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }

    .no-users mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .stats-card {
      margin-top: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-item mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3f51b5;
    }

    .stat-details h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .stat-details p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .profile-card {
      margin-top: 16px;
    }

    .profile-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .profile-avatar {
      position: relative;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-color {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      opacity: 0.2;
    }

    .profile-avatar mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
    }

    .profile-details h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
    }

    .profile-details p {
      margin: 0 0 4px 0;
      color: #666;
    }

    .profile-details small {
      color: #999;
      font-size: 12px;
    }

    .profile-actions {
      display: flex;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .users-container {
        padding: 8px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .profile-info {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  users$: Observable<User[]>;
  currentUser$: Observable<User | null>;
  totalEvents = 0;
  sharedEvents = 0;

  private colorNames: { [key: string]: string } = {
    '#f44336': 'Vermelho',
    '#e91e63': 'Rosa',
    '#9c27b0': 'Roxo',
    '#673ab7': 'Azul Escuro',
    '#3f51b5': 'Índigo',
    '#2196f3': 'Azul',
    '#03a9f4': 'Azul Claro',
    '#00bcd4': 'Ciano',
    '#009688': 'Verde Azulado',
    '#4caf50': 'Verde',
    '#8bc34a': 'Verde Claro',
    '#cddc39': 'Lima',
    '#ffeb3b': 'Amarelo',
    '#ffc107': 'Âmbar',
    '#ff9800': 'Laranja',
    '#ff5722': 'Laranja Escuro'
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.users$ = this.userService.getAllUsers();
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    // TODO: Carregar estatísticas de eventos
    this.loadEventStats();
  }

  private loadEventStats() {
    // Placeholder para estatísticas
    this.totalEvents = 0;
    this.sharedEvents = 0;
  }

  isCurrentUser(userId: string): boolean {
    return this.authService.getCurrentUserId() === userId;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }

  getColorName(color: string): string {
    return this.colorNames[color] || 'Cor personalizada';
  }

  editProfile(user: User) {
    // TODO: Implementar modal de edição de perfil
    console.log('Editar perfil:', user);
  }
}

