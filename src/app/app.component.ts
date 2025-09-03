import { Component, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CalendarComponent } from './features/calendar/calendar.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatCardModule,
    MatCheckboxModule,
  CalendarComponent
  ]
})
export class AppComponent implements OnInit {
  // Propriedades para filtro de usuários e integração com calendário
  calendarUsers: User[] = [];
  calendarSelectedUserIds: string[] = [];
  calendarToggleUserFn = (userId: string, checked: boolean) => {
    if (checked) {
      if (!this.calendarSelectedUserIds.includes(userId)) {
        this.calendarSelectedUserIds = [...this.calendarSelectedUserIds, userId];
      }
    } else {
      this.calendarSelectedUserIds = this.calendarSelectedUserIds.filter(id => id !== userId);
    }
  };
  // Propriedades para compatibilidade com o template
  get users(): User[] {
    return this.calendarUsers;
  }
  get selectedUserIds(): string[] {
    return this.calendarSelectedUserIds;
  }
  toggleUser(userId: string, checked: boolean) {
    this.calendarToggleUserFn(userId, checked);
  }
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

