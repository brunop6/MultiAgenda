import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <div class="events-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Meus Eventos</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <mat-list *ngIf="events$ | async as events; else noEvents">
            <mat-list-item *ngFor="let event of events">
              <div class="event-item">
                <div class="event-color" [style.background-color]="event.color"></div>
                <div class="event-details">
                  <h3>{{ event.name }}</h3>
                  <p>{{ formatEventDate(event) }}</p>
                  <p *ngIf="event.location">{{ event.location }}</p>
                </div>
                <div class="event-actions">
                  <button mat-icon-button [routerLink]="['/events', event.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteEvent(event.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-list-item>
          </mat-list>
          
          <ng-template #noEvents>
            <div class="no-events">
              <mat-icon>event_note</mat-icon>
              <p>Nenhum evento encontrado</p>
              <button mat-raised-button color="primary" routerLink="/events/new">
                Criar Primeiro Evento
              </button>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
      
      <button mat-flat-button color="primary" class="add-fab" routerLink="/events/new">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .events-container {
      padding: 16px;
      position: relative;
    }

    .event-item {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 8px 0;
    }

    .event-color {
      width: 4px;
      height: 40px;
      border-radius: 2px;
    }

    .event-details {
      flex: 1;
    }

    .event-details h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
    }

    .event-details p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .event-actions {
      display: flex;
      gap: 8px;
    }

    .no-events {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }

    .no-events mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .add-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
    }

    @media (max-width: 768px) {
      .events-container {
        padding: 8px;
      }
      
      .add-fab {
        bottom: 16px;
        right: 16px;
      }
    }
  `]
})
export class EventsListComponent implements OnInit {
  events$: Observable<Event[]> | null = null;

  constructor(
    private eventService: EventService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.events$ = this.eventService.getEventsForUser(userId);
    }
  }

  formatEventDate(event: Event): string {
    const date = event.date.toLocaleDateString('pt-BR');
    const startTime = event.startTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = event.endTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${date} • ${startTime} - ${endTime}`;
  }

  async deleteEvent(eventId: string) {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        await this.eventService.deleteEvent(eventId);
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
      }
    }
  }
}

