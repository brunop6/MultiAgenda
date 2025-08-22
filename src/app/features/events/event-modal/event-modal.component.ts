import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { RecurrenceType, Event } from '../../../core/models';

// Formato brasileiro para datas
export const BR_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export interface EventModalData {
  event?: Event;
  date?: Date;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  template: `
    <div class="event-modal">
      <h2 mat-dialog-title>
        <mat-icon>{{ getModalIcon() }}</mat-icon>
        {{ getModalTitle() }}
      </h2>
      
      <mat-dialog-content>
        <form [formGroup]="eventForm" *ngIf="data.mode !== 'view'">
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
              <mat-error *ngIf="eventForm.get('date')?.hasError('required')">
                Data é obrigatória
              </mat-error>
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
              <mat-error *ngIf="eventForm.get('startTime')?.hasError('required')">
                Hora início é obrigatória
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Hora Fim</mat-label>
              <input matInput type="time" formControlName="endTime" required>
              <mat-error *ngIf="eventForm.get('endTime')?.hasError('required')">
                Hora fim é obrigatória
              </mat-error>
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

        <!-- View Mode -->
        <div *ngIf="data.mode === 'view'" class="event-details">
          <div class="detail-item">
            <mat-icon>event</mat-icon>
            <span class="label">Nome:</span>
            <span class="value">{{ data.event?.name }}</span>
          </div>
          
          <div class="detail-item">
            <mat-icon>calendar_today</mat-icon>
            <span class="label">Data:</span>
            <span class="value">{{ formatDate(data.event?.date) }}</span>
          </div>
          
          <div class="detail-item">
            <mat-icon>access_time</mat-icon>
            <span class="label">Horário:</span>
            <span class="value">
              {{ formatTime(data.event?.startTime) }} - {{ formatTime(data.event?.endTime) }}
            </span>
          </div>
          
          <div class="detail-item" *ngIf="data.event?.location">
            <mat-icon>location_on</mat-icon>
            <span class="label">Local:</span>
            <span class="value">{{ data.event?.location }}</span>
          </div>
          
          <div class="detail-item" *ngIf="data.event?.notes">
            <mat-icon>notes</mat-icon>
            <span class="label">Observações:</span>
            <span class="value">{{ data.event?.notes }}</span>
          </div>
          
          <div class="detail-item">
            <mat-icon>repeat</mat-icon>
            <span class="label">Repetição:</span>
            <span class="value">{{ getRecurrenceText(data.event?.recurrence) }}</span>
          </div>
          
          <div class="detail-item">
            <mat-icon>{{ data.event?.isShared ? 'public' : 'lock' }}</mat-icon>
            <span class="label">Visibilidade:</span>
            <span class="value">{{ data.event?.isShared ? 'Compartilhado' : 'Privado' }}</span>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.mode === 'view' ? 'Fechar' : 'Cancelar' }}
        </button>
        
        <button mat-button color="warn" *ngIf="data.mode === 'view' && canDelete()" (click)="onDelete()">
          <mat-icon>delete</mat-icon>
          Excluir
        </button>
        
        <button mat-button color="primary" *ngIf="data.mode === 'view' && canEdit()" (click)="onEdit()">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
        
        <button mat-raised-button color="primary" 
                *ngIf="data.mode !== 'view'"
                [disabled]="eventForm.invalid || isLoading"
                (click)="onSave()">
          <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
          {{ data.mode === 'edit' ? 'Atualizar' : 'Criar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .event-modal {
      width: 100%;
      max-width: 500px;
    }

    .event-modal h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
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

    .event-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail-item mat-icon {
      color: #666;
      width: 24px;
    }

    .detail-item .label {
      font-weight: 500;
      min-width: 80px;
      color: #666;
    }

    .detail-item .value {
      flex: 1;
    }

    @media (max-width: 480px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .detail-item .label {
        min-width: auto;
      }
    }
  `],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS }
  ]
})
export class EventModalComponent implements OnInit {
  eventForm: FormGroup;
  isLoading = false;
  
  availableColors = [
    { name: 'Vermelho', value: '#f44336' },
    { name: 'Rosa', value: '#e91e63' },
    { name: 'Roxo', value: '#9c27b0' },
    { name: 'Azul Escuro', value: '#673ab7' },
    { name: 'Índigo', value: '#3f51b5' },
    { name: 'Azul', value: '#2196f3' },
    { name: 'Azul Claro', value: '#03a9f4' },
    { name: 'Verde Azulado', value: '#009688' },
    { name: 'Verde', value: '#4caf50' },
    { name: 'Verde Claro', value: '#8bc34a' },
    { name: 'Amarelo', value: '#ffeb3b' },
    { name: 'Laranja', value: '#ff9800' },
    { name: 'Laranja Escuro', value: '#ff5722' }
  ];

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventModalData
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
    if (this.data.date) {
      this.eventForm.patchValue({
        date: this.data.date
      });
    }

    if (this.data.event && this.data.mode === 'edit') {
      this.loadEventData();
    }
  }

  private loadEventData() {
    if (!this.data.event) return;

    this.eventForm.patchValue({
      name: this.data.event.name,
      date: this.data.event.date,
      startTime: this.formatTimeForInput(this.data.event.startTime),
      endTime: this.formatTimeForInput(this.data.event.endTime),
      color: this.data.event.color,
      location: this.data.event.location || '',
      notes: this.data.event.notes || '',
      recurrence: this.data.event.recurrence,
      isShared: this.data.event.isShared
    });
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

  getModalTitle(): string {
    switch (this.data.mode) {
      case 'create': return 'Novo Evento';
      case 'edit': return 'Editar Evento';
      case 'view': return 'Detalhes do Evento';
      default: return 'Evento';
    }
  }

  getModalIcon(): string {
    switch (this.data.mode) {
      case 'create': return 'add_circle';
      case 'edit': return 'edit';
      case 'view': return 'event';
      default: return 'event';
    }
  }

  canEdit(): boolean {
    if (!this.data.event) return false;
    const currentUserId = this.authService.getCurrentUserId();
    return this.data.event.userId === currentUserId;
  }

  canDelete(): boolean {
    return this.canEdit();
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  getRecurrenceText(recurrence?: RecurrenceType): string {
    switch (recurrence) {
      case RecurrenceType.DAILY: return 'Diariamente';
      case RecurrenceType.WEEKLY: return 'Semanalmente';
      case RecurrenceType.MONTHLY: return 'Mensalmente';
      case RecurrenceType.YEARLY: return 'Anualmente';
      default: return 'Não repete';
    }
  }

  async onSave() {
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
          participants: this.data.event?.participants || [],
          isShared: formValue.isShared
        };

        const userId = this.authService.getCurrentUserId();
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }

        if (this.data.mode === 'edit' && this.data.event) {
          await this.eventService.updateEvent(this.data.event.id, eventData);
          this.snackBar.open('Evento atualizado com sucesso!', 'Fechar', { duration: 3000 });
        } else {
          await this.eventService.createEvent(eventData, userId);
          this.snackBar.open('Evento criado com sucesso!', 'Fechar', { duration: 3000 });
        }
        
        this.dialogRef.close(true);
      } catch (error: any) {
        this.snackBar.open(error.message || 'Erro ao salvar evento', 'Fechar', { duration: 5000 });
      } finally {
        this.isLoading = false;
      }
    }
  }

  onEdit() {
    this.data.mode = 'edit';
    this.loadEventData();
  }

  async onDelete() {
    if (!this.data.event) return;

    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        await this.eventService.deleteEvent(this.data.event.id);
        this.snackBar.open('Evento excluído com sucesso!', 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      } catch (error: any) {
        this.snackBar.open(error.message || 'Erro ao excluir evento', 'Fechar', { duration: 5000 });
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
