import { Component, OnInit, OnDestroy, inject, AfterViewInit, ViewChild, ElementRef, HostListener, Output, EventEmitter, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, Observable } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { CalendarService, CalendarDay, CalendarMonth, CalendarView } from '../../core/services/calendar.service';
import { EventService } from '../../core/services/event.service';
import { TestEventService } from '../../core/services/test-event.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { CalendarEvent } from '../../core/models/event.model';
import { User } from '../../core/models/user.model';
import { Event } from '../../core/models/event.model';
import { EventModalComponent, EventModalData } from '../events/event-modal/event-modal.component';

interface EventPosition {
  event: CalendarEvent;
  height: number;
  top: number;
  left: number;
  width: number;
}


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    MatMenuModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ContentChild('userFilters') userFilters!: TemplateRef<any>;
  @Input() externalUsers: User[] = [];
  @Input() externalSelectedUserIds: string[] = [];
  @Input() externalToggleUser?: (userId: string, checked: boolean) => void;
  @Output() usersChange = new EventEmitter<User[]>();
  @Output() selectedUserIdsChange = new EventEmitter<string[]>();
  private destroy$ = new Subject<void>();

  @ViewChild('weekContent', { static: false }) weekContentRef!: ElementRef;

  currentMonth: CalendarMonth | null = null;
  currentView: CalendarView = CalendarView.WEEK;
  selectedDate: Date = new Date();

  // Propriedades de zoom
  zoomLevel: number = 1; // Nível de zoom padrão
  minZoom: number = 0.5; // Zoom mínimo (50%)
  maxZoom: number = 3; // Zoom máximo (300%)
  zoomStep: number = 0.25; // Incremento do zoom

  users: User[] = [];
  selectedUserIds: string[] = [];
  events: CalendarEvent[] = [];

  dayHeaders = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  timeSlots = Array.from({ length: 24 }, (_, i) => i);
  weekDays: CalendarDay[] = [];


  // Services
  private calendarService = inject(CalendarService);
  private eventService = inject(EventService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  currentUser$ = this.authService.currentUser$;

  signOut() {
    this.authService.signOut();
  }

  constructor() {

  }

  ngOnInit() {
    // Só carrega usuários quando autenticado
    this.currentUser$
      .pipe(takeUntil(this.destroy$))

      .subscribe(user => {
        if (user) {
          this.loadUsers();
          this.eventService.reloadEvents();
        } else {
          this.users = [];
          this.selectedUserIds = [];
          this.events = [];
        }
      });

    this.loadEvents();
    this.updateCalendar();
  }

  ngOnDestroy() {
    // Remover event listeners
    if (this.weekContentRef?.nativeElement) {
      this.weekContentRef.nativeElement.removeEventListener('wheel', this.handleWheelZoom.bind(this));
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    // Aguardar um tick para garantir que a view foi renderizada
    setTimeout(() => {
      this.scrollToMorningTime();
    }, 100);

    // Adicionar event listener para zoom com wheel
    if (this.weekContentRef?.nativeElement) {
      this.weekContentRef.nativeElement.addEventListener('wheel', this.handleWheelZoom.bind(this), { passive: false });
    }
  }

  private scrollToMorningTime() {
    if (this.currentView === CalendarView.WEEK && this.weekContentRef?.nativeElement) {
      // Scroll para 6:00 AM considerando o zoom atual
      const scrollPosition = 6 * this.getHourHeight(); // 6 horas * altura por hora com zoom
      this.weekContentRef.nativeElement.scrollTop = scrollPosition;
    }
  }

  // Carregamento de dados
  private loadUsers() {
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users: User[]) => {
        this.users = users;
        this.selectedUserIds = users.map((u: User) => u.id);
        this.usersChange.emit(this.users);
        this.selectedUserIdsChange.emit(this.selectedUserIds);
      });
  }

  private loadEvents() {
    this.eventService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((events: Event[]) => {
        // Converter Event[] para CalendarEvent[] usando o método do service
        this.events = events.map(event => this.eventService.toCalendarEvent(event));
      });
  }

  // Navegação do calendário
  navigateToPrevious() {
    const currentDate = this.getCurrentDate();

    switch (this.currentView) {
      case CalendarView.MONTH:
        this.calendarService.setCurrentDate(this.calendarService.addMonths(currentDate, -1));
        break;
      case CalendarView.WEEK:
        this.calendarService.setCurrentDate(this.calendarService.addDays(currentDate, -7));
        break;
    }
    this.updateCalendar();
  }

  navigateToNext() {
    const currentDate = this.getCurrentDate();

    switch (this.currentView) {
      case CalendarView.MONTH:
        this.calendarService.setCurrentDate(this.calendarService.addMonths(currentDate, 1));
        break;
      case CalendarView.WEEK:
        this.calendarService.setCurrentDate(this.calendarService.addDays(currentDate, 7));
        break;
    }
    this.updateCalendar();
  }

  navigateToToday() {
    this.calendarService.navigateToToday();
    this.selectedDate = new Date();
    this.updateCalendar();
  }

  onViewChange(view: CalendarView) {
    this.currentView = view;
    this.updateCalendar();
  }

  private updateCalendar() {
    // Sempre gerar os dias da semana para a visualização semanal
    this.weekDays = this.calendarService.generateCalendarWeek(this.getCurrentDate());

    this.currentMonth = this.calendarService.generateCalendarMonth(this.getCurrentDate());
  }

  private getCurrentDate(): Date {
    return this.calendarService.getCurrentDate();
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.updateCalendar();
  }

  openEventFormForDate(date: Date, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }

    const modalData: EventModalData = {
      date: date,
      mode: 'create'
    };

    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents();
      }
    });
  }

  // Filtragem de usuários
  toggleUser(userId: string, checked: boolean) {
    if (this.externalToggleUser) {
      this.externalToggleUser(userId, checked);
      return;
    }
    if (checked) {
      if (!this.selectedUserIds.includes(userId)) {
        this.selectedUserIds.push(userId);
      }
    } else {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
    }
    this.selectedUserIdsChange.emit(this.selectedUserIds);
  }

  // Obtenção de eventos
  getEventsForDay(date: Date): CalendarEvent[] {
    const dateStr = date.toDateString();
    const filteredEvents = this.events.filter(event => {
      const eventDateStr = event.startTime.toDateString();
      const matchesDate = eventDateStr === dateStr;
      const matchesUser = this.selectedUserIds.includes(event.userId);
      return matchesDate && matchesUser;
    });

    // Remove eventos duplicados
    return this.removeDuplicateEvents(filteredEvents);
  }

  getEventsForDayAndHour(date: Date, hour: number): CalendarEvent[] {
    const dayEvents = this.getEventsForDay(date); // Já aplica deduplicação
    return dayEvents.filter(event => {
      const eventHour = event.startTime.getHours();
      const eventEndHour = event.endTime.getHours();
      return hour >= eventHour && hour < eventEndHour;
    });
  }

  // Novo método que retorna eventos com posição contínua (não limitados por hora)
  getEventsForDayWithPosition(date: Date): EventPosition[] {
    const dayEvents = this.getEventsForDay(date); // Já aplica deduplicação
    const positions: EventPosition[] = [];

    if (dayEvents.length === 0) return positions;

    // Agrupa eventos que se sobrepõem ao longo do dia
    const overlappingGroups = this.groupOverlappingEventsForDay(dayEvents);

    overlappingGroups.forEach(group => {
      const groupWidth = 100 / group.length; // Largura em porcentagem para cada evento no grupo

      group.forEach((event, index) => {
        // Calcular posição vertical baseada no horário de início com zoom
        const eventStartHour = event.startTime.getHours();
        const eventStartMinutes = event.startTime.getMinutes();
        const eventEndHour = event.endTime.getHours();
        const eventEndMinutes = event.endTime.getMinutes();

        // Calcular posição do topo (baseado na hora de início) com zoom
        const topPosition = (eventStartHour * this.getHourHeight()) + ((eventStartMinutes / 60) * this.getHourHeight());

        // Calcular altura (baseado na duração total) com zoom
        const totalStartMinutes = eventStartHour * 60 + eventStartMinutes;
        const totalEndMinutes = eventEndHour * 60 + eventEndMinutes;
        const durationMinutes = totalEndMinutes - totalStartMinutes;
        const height = (durationMinutes / 60) * this.getHourHeight();

        // Calcular posição horizontal para eventos paralelos
        const leftOffsetPercent = index * groupWidth;
        const eventWidthPercent = groupWidth * 0.95; // 95% para dar espaço entre eventos

        positions.push({
          event,
          left: leftOffsetPercent,
          top: topPosition,
          width: eventWidthPercent,
          height: height
        });
      });
    });

    return positions;
  }

  getEventsForDayAndHourWithPosition(date: Date, hour: number): EventPosition[] {
    const hourEvents = this.getEventsForDayAndHour(date, hour); // Já aplica deduplicação
    const positions: EventPosition[] = [];

    // Garantir que não há eventos duplicados (dupla verificação)
    const uniqueEvents = this.removeDuplicateEvents(hourEvents);

    // Agrupa eventos que se sobrepõem
    const overlappingGroups = this.groupOverlappingEvents(uniqueEvents, hour);

    overlappingGroups.forEach(group => {
      const groupWidth = 100 / group.length; // Largura em porcentagem para cada evento no grupo

      group.forEach((event, index) => {
        // Calcular posição e tamanho baseado no horário
        const eventStartMinutes = event.startTime.getHours() * 60 + event.startTime.getMinutes();
        const eventEndMinutes = event.endTime.getHours() * 60 + event.endTime.getMinutes();
        const hourStartMinutes = hour * 60;
        const hourEndMinutes = (hour + 1) * 60;

        // Calcular o offset do topo dentro da hora (0-60 minutos)
        const topOffsetMinutes = Math.max(0, eventStartMinutes - hourStartMinutes);
        const topOffset = (topOffsetMinutes / 60) * 60; // 60px por hora

        // Calcular altura baseada na duração dentro desta hora
        const visibleStartMinutes = Math.max(hourStartMinutes, eventStartMinutes);
        const visibleEndMinutes = Math.min(hourEndMinutes, eventEndMinutes);
        const visibleDurationMinutes = visibleEndMinutes - visibleStartMinutes;
        const height = (visibleDurationMinutes / 60) * 60; // 60px por hora

        // Calcular posição horizontal para eventos paralelos
        const leftOffsetPercent = index * groupWidth;
        const eventWidthPercent = groupWidth * 0.95; // 95% para dar espaço entre eventos

        positions.push({
          event,
          left: leftOffsetPercent,
          top: topOffset,
          width: eventWidthPercent,
          height: height
        });
      });
    });

    return positions;
  }

  private removeDuplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      // Para eventos compartilhados, usar o ID do evento como chave única
      const key = event.id || `${event.name}-${event.startTime.getTime()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private groupOverlappingEvents(events: CalendarEvent[], hour: number): CalendarEvent[][] {
    if (events.length === 0) return [];

    // Ordenar eventos por horário de início
    const sortedEvents = [...events].sort((a, b) =>
      a.startTime.getTime() - b.startTime.getTime()
    );

    const groups: CalendarEvent[][] = [];
    const hourStart = hour * 60; // Minutos desde meia-noite
    const hourEnd = (hour + 1) * 60;

    for (const event of sortedEvents) {
      const eventStartMinutes = event.startTime.getHours() * 60 + event.startTime.getMinutes();
      const eventEndMinutes = event.endTime.getHours() * 60 + event.endTime.getMinutes();

      // Encontrar o grupo ao qual este evento pertence
      let addedToGroup = false;

      for (const group of groups) {
        // Verificar se este evento se sobrepõe com algum evento do grupo
        const hasOverlap = group.some(groupEvent => {
          const groupEventStartMinutes = groupEvent.startTime.getHours() * 60 + groupEvent.startTime.getMinutes();
          const groupEventEndMinutes = groupEvent.endTime.getHours() * 60 + groupEvent.endTime.getMinutes();

          return !(eventEndMinutes <= groupEventStartMinutes || eventStartMinutes >= groupEventEndMinutes);
        });

        if (hasOverlap) {
          group.push(event);
          addedToGroup = true;
          break;
        }
      }

      // Se não foi adicionado a nenhum grupo, criar um novo
      if (!addedToGroup) {
        groups.push([event]);
      }
    }

    return groups;
  }

  // Método para agrupar eventos que se sobrepõem ao longo do dia inteiro
  private groupOverlappingEventsForDay(events: CalendarEvent[]): CalendarEvent[][] {
    if (events.length === 0) return [];

    // Ordenar eventos por horário de início
    const sortedEvents = [...events].sort((a, b) =>
      a.startTime.getTime() - b.startTime.getTime()
    );

    const groups: CalendarEvent[][] = [];

    for (const event of sortedEvents) {
      const eventStartMinutes = event.startTime.getHours() * 60 + event.startTime.getMinutes();
      const eventEndMinutes = event.endTime.getHours() * 60 + event.endTime.getMinutes();

      // Encontrar o grupo ao qual este evento pertence
      let addedToGroup = false;

      for (const group of groups) {
        // Verificar se este evento se sobrepõe com algum evento do grupo
        const hasOverlap = group.some(groupEvent => {
          const groupEventStartMinutes = groupEvent.startTime.getHours() * 60 + groupEvent.startTime.getMinutes();
          const groupEventEndMinutes = groupEvent.endTime.getHours() * 60 + groupEvent.endTime.getMinutes();

          return !(eventEndMinutes <= groupEventStartMinutes || eventStartMinutes >= groupEventEndMinutes);
        });

        if (hasOverlap) {
          group.push(event);
          addedToGroup = true;
          break;
        }
      }

      // Se não foi adicionado a nenhum grupo, criar um novo
      if (!addedToGroup) {
        groups.push([event]);
      }
    }

    return groups;
  }

  getEventTooltip(event: CalendarEvent): string {
    let tooltip = `${event.name}\n`;
    tooltip += `${this.formatTime(event.startTime)} - ${this.formatTime(event.endTime)}`;
    if (event.location) {
      tooltip += `\nLocal: ${event.location}`;
    }
    if (event.notes) {
      tooltip += `\nNotas: ${event.notes}`;
    }
    return tooltip;
  }

  // Formatação
  formatSelectedDate(): string {
    return this.calendarService.formatDate(this.selectedDate, 'dd/MM/yyyy');
  }

  formatTime(date: Date): string {
    return this.calendarService.formatTime(date);
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  getDayName(day: number): string {
    return this.calendarService.getDayName(day);
  }

  // Ações
  openEventForm() {
    const modalData: EventModalData = {
      date: this.selectedDate,
      mode: 'create'
    };

    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents(); // Recarregar eventos se algo foi salvo
      }
    });
  }

  openEventDetail(event: CalendarEvent, mouseEvent: MouseEvent) {
    mouseEvent.stopPropagation();

    const modalData: EventModalData = {
      event: event,
      mode: 'view'
    };

    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents(); // Recarregar eventos se algo foi modificado
      }
    });
  }

  // Método para obter a cor do usuário proprietário do evento
  getUserColor(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user?.color || '#6c757d'; // Cor padrão se usuário não encontrado
  }

  // Métodos de controle de zoom
  zoomIn() {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
    }
  }

  zoomOut() {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
    }
  }

  resetZoom() {
    this.zoomLevel = 1;
  }

  // Método para obter a altura das linhas baseada no zoom
  getHourHeight(): number {
    return 45 * this.zoomLevel; // 45px base * nível de zoom (reduzido de 60px para 45px = 75% da escala original)
  }

  // Método para obter o estilo CSS das linhas de horário
  getTimeSlotStyle(): { [key: string]: string } {
    return {
      'height': `${this.getHourHeight()}px`
    };
  }

  // Método para obter posição dos eventos com zoom
  getEventPositionWithZoom(event: CalendarEvent): { top: number, height: number } {
    const eventStartHour = event.startTime.getHours();
    const eventStartMinutes = event.startTime.getMinutes();
    const eventEndHour = event.endTime.getHours();
    const eventEndMinutes = event.endTime.getMinutes();

    // Calcular posição do topo (baseado na hora de início)
    const topPosition = (eventStartHour * this.getHourHeight()) + ((eventStartMinutes / 60) * this.getHourHeight());

    // Calcular altura (baseado na duração total)
    const totalStartMinutes = eventStartHour * 60 + eventStartMinutes;
    const totalEndMinutes = eventEndHour * 60 + eventEndMinutes;
    const durationMinutes = totalEndMinutes - totalStartMinutes;
    const height = (durationMinutes / 60) * this.getHourHeight();

    return { top: topPosition, height: height };
  }

  // Método para controlar zoom com wheel do mouse
  handleWheelZoom(event: WheelEvent) {
    if (this.currentView !== CalendarView.WEEK) return;

    // Verificar se Ctrl está pressionado para zoom
    if (event.ctrlKey) {
      event.preventDefault();

      const scrollPosition = this.weekContentRef.nativeElement.scrollTop;
      const containerHeight = this.weekContentRef.nativeElement.clientHeight;
      const scrollPercent = scrollPosition / (this.weekContentRef.nativeElement.scrollHeight - containerHeight);

      if (event.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }

      // Manter posição de scroll relativa após o zoom
      setTimeout(() => {
        const newScrollHeight = this.weekContentRef.nativeElement.scrollHeight - containerHeight;
        this.weekContentRef.nativeElement.scrollTop = newScrollHeight * scrollPercent;
      }, 10);
    }
  }

  // Atalhos de teclado para zoom
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    if (this.currentView !== CalendarView.WEEK) return;

    // Ctrl + Plus/Equals para zoom in
    if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
      event.preventDefault();
      this.zoomIn();
    }

    // Ctrl + Minus para zoom out
    if (event.ctrlKey && event.key === '-') {
      event.preventDefault();
      this.zoomOut();
    }

    // Ctrl + 0 para reset zoom
    if (event.ctrlKey && event.key === '0') {
      event.preventDefault();
      this.resetZoom();
    }
  }
}
