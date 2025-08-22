import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventService } from '../../../core/services/event.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { RecurrenceType, User } from '../../../core/models';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            {{ isEditing ? 'Editar Evento' : 'Novo Evento' }}
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome do Evento</mat-label>
              <input matInput formControlName="name" required>
              <mat-error *ngIf="eventForm.get('name')?.hasError('required')">
                Nome é obrigatório
              </mat-error>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Data</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Cor</mat-label>
                <mat-select formControlName="color" required>
                  <mat-option *ngFor="let color of availableColors" [value]="color.value">
                    <div class="color-option">
                      <div class="color-circle" [style.background-color]="color.value"></div>
                      {{ color.name }}
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Hora Início</mat-label>
                <input matInput type="time" formControlName="startTime" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hora Fim</mat-label>
                <input matInput type="time" formControlName="endTime" required>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Local</mat-label>
              <input matInput formControlName="location">
              <mat-icon matSuffix>location_on</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Observações</mat-label>
              <textarea matInput rows="3" formControlName="notes"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Repetição</mat-label>
              <mat-select formControlName="recurrence">
                <mat-option value="none">Não repete</mat-option>
                <mat-option value="daily">Diariamente</mat-option>
                <mat-option value="weekly">Semanalmente</mat-option>
                <mat-option value="monthly">Mensalmente</mat-option>
                <mat-option value="yearly">Anualmente</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-checkbox formControlName="isShared" class="full-width">
              Evento compartilhado (visível para todos os usuários)
            </mat-checkbox>
          </form>
        </mat-card-content>
        
        <mat-card-actions align="end">
          <button mat-button type="button" (click)="cancel()">Cancelar</button>
          <button mat-raised-button color="primary" 
                  [disabled]="eventForm.invalid || isLoading"
                  (click)="onSubmit()">
            {{ isEditing ? 'Atualizar' : 'Criar' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .color-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid #ccc;
    }

    @media (max-width: 768px) {
      .form-container {
        padding: 8px;
      }
      
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEditing = false;
  isLoading = false;
  eventId: string | null = null;
  users: User[] = [];
  
  availableColors = [
    { name: 'Vermelho', value: '#f44336' },
    { name: 'Rosa', value: '#e91e63' },
    { name: 'Roxo', value: '#9c27b0' },
    { name: 'Azul', value: '#2196f3' },
    { name: 'Verde', value: '#4caf50' },
    { name: 'Laranja', value: '#ff9800' }
  ];

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.eventForm = this.fb.group({
      name: ['', [Validators.required]],
      date: [new Date(), [Validators.required]],
      startTime: ['09:00', [Validators.required]],
      endTime: ['10:00', [Validators.required]],
      color: ['#2196f3', [Validators.required]],
      location: [''],
      notes: [''],
      recurrence: [RecurrenceType.NONE],
      isShared: [false]
    });
  }

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.eventId;
    
    if (this.isEditing && this.eventId) {
      this.loadEvent(this.eventId);
    }
  }

  private async loadEvent(eventId: string) {
    try {
      this.eventService.getEvent(eventId).subscribe(event => {
        if (event) {
          this.eventForm.patchValue({
            name: event.name,
            date: event.date,
            startTime: this.formatTimeForInput(event.startTime),
            endTime: this.formatTimeForInput(event.endTime),
            color: event.color,
            location: event.location,
            notes: event.notes,
            recurrence: event.recurrence,
            isShared: event.isShared
          });
        }
      });
    } catch (error) {
      this.snackBar.open('Erro ao carregar evento', 'Fechar', { duration: 3000 });
    }
  }

  private formatTimeForInput(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  private parseTimeInput(timeString: string, date: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  async onSubmit() {
    if (this.eventForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      try {
        const formValue = this.eventForm.value;
        const eventDate = new Date(formValue.date);
        
        const eventData = {
          name: formValue.name,
          color: formValue.color,
          startTime: this.parseTimeInput(formValue.startTime, eventDate),
          endTime: this.parseTimeInput(formValue.endTime, eventDate),
          date: eventDate,
          recurrence: formValue.recurrence,
          location: formValue.location,
          notes: formValue.notes,
          participants: [],
          isShared: formValue.isShared
        };

        const userId = this.authService.getCurrentUserId();
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }

        if (this.isEditing && this.eventId) {
          await this.eventService.updateEvent(this.eventId, eventData);
          this.snackBar.open('Evento atualizado com sucesso!', 'Fechar', { duration: 3000 });
        } else {
          await this.eventService.createEvent(eventData, userId);
          this.snackBar.open('Evento criado com sucesso!', 'Fechar', { duration: 3000 });
        }
        
        this.router.navigate(['/calendar']);
      } catch (error: any) {
        this.snackBar.open(error.message || 'Erro ao salvar evento', 'Fechar', { duration: 5000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  cancel() {
    this.router.navigate(['/calendar']);
  }
}

