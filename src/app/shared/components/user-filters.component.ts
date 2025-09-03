import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-user-filters',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatCheckboxModule],
  template: `
  <mat-card class="user-filters" *ngIf="users.length > 0">
      <mat-card-content>
        <h3>Agendas</h3>
        <div class="user-checkboxes">
          <mat-checkbox
            *ngFor="let user of users"
            [checked]="selectedUserIds?.includes(user.id)"
            (change)="toggleUser?.(user.id, $event.checked)"
          >
            <div class="user-option">
              <div class="user-color" [style.background-color]="user.color"></div>
              {{ user.name }}
            </div>
          </mat-checkbox>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class UserFiltersComponent {
  @Input() users: User[] = [];
  @Input() selectedUserIds: string[] = [];
  @Input() toggleUser?: (userId: string, checked: boolean) => void;
}
