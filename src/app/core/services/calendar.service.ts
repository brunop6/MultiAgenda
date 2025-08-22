import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: any[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
  monthName: string;
}

export enum CalendarView {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day'
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private currentDateSubject = new BehaviorSubject<Date>(new Date());
  private currentViewSubject = new BehaviorSubject<CalendarView>(CalendarView.WEEK);
  private selectedDateSubject = new BehaviorSubject<Date>(new Date());

  public currentDate$ = this.currentDateSubject.asObservable();
  public currentView$ = this.currentViewSubject.asObservable();
  public selectedDate$ = this.selectedDateSubject.asObservable();

  constructor() {}

  // Getters
  getCurrentDate(): Date {
    return this.currentDateSubject.value;
  }

  getCurrentView(): CalendarView {
    return this.currentViewSubject.value;
  }

  getSelectedDate(): Date {
    return this.selectedDateSubject.value;
  }

  // Setters
  setCurrentDate(date: Date): void {
    this.currentDateSubject.next(new Date(date));
  }

  setCurrentView(view: CalendarView): void {
    this.currentViewSubject.next(view);
  }

  setSelectedDate(date: Date): void {
    this.selectedDateSubject.next(new Date(date));
  }

  // Navegação
  navigateToToday(): void {
    const today = new Date();
    this.setCurrentDate(today);
    this.setSelectedDate(today);
  }

  navigateToPrevious(): void {
    const currentDate = this.getCurrentDate();
    const view = this.getCurrentView();
    
    switch (view) {
      case CalendarView.MONTH:
        this.setCurrentDate(this.addMonths(currentDate, -1));
        break;
      case CalendarView.WEEK:
        this.setCurrentDate(this.addDays(currentDate, -7));
        break;
      case CalendarView.DAY:
        this.setCurrentDate(this.addDays(currentDate, -1));
        break;
    }
  }

  navigateToNext(): void {
    const currentDate = this.getCurrentDate();
    const view = this.getCurrentView();
    
    switch (view) {
      case CalendarView.MONTH:
        this.setCurrentDate(this.addMonths(currentDate, 1));
        break;
      case CalendarView.WEEK:
        this.setCurrentDate(this.addDays(currentDate, 7));
        break;
      case CalendarView.DAY:
        this.setCurrentDate(this.addDays(currentDate, 1));
        break;
    }
  }

  // Geração de calendário
  generateCalendarMonth(date: Date): CalendarMonth {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Encontrar o primeiro dia da primeira semana (segunda-feira)
    const firstDayOfWeek = new Date(firstDayOfMonth);
    let dayOfWeek = firstDayOfMonth.getDay();
    // Ajustar para segunda-feira ser 0 (domingo = 0, segunda = 1, etc.)
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - dayOfWeek);
    
    // Encontrar o último dia da última semana (domingo)
    const lastDayOfWeek = new Date(lastDayOfMonth);
    let lastDayOfWeekNum = lastDayOfMonth.getDay();
    lastDayOfWeekNum = lastDayOfWeekNum === 0 ? 6 : lastDayOfWeekNum - 1;
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + (6 - lastDayOfWeekNum));
    
    const weeks: CalendarWeek[] = [];
    let currentDate = new Date(firstDayOfWeek);
    
    while (currentDate <= lastDayOfWeek) {
      const week: CalendarWeek = { days: [] };
      
      for (let i = 0; i < 7; i++) {
        const day: CalendarDay = {
          date: new Date(currentDate),
          isCurrentMonth: currentDate.getMonth() === month,
          isToday: this.isSameDay(currentDate, new Date()),
          isSelected: this.isSameDay(currentDate, this.getSelectedDate()),
          events: []
        };
        
        week.days.push(day);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(week);
    }
    
    return {
      year,
      month,
      weeks,
      monthName: this.getMonthName(month)
    };
  }

  generateCalendarWeek(date: Date): CalendarDay[] {
    const startOfWeek = this.getStartOfWeek(date);
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: true,
        isToday: this.isSameDay(currentDate, new Date()),
        isSelected: this.isSameDay(currentDate, this.getSelectedDate()),
        events: []
      });
    }
    
    return days;
  }

  // Utilitários de data
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
  }

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    // Ajustar para segunda-feira ser o início da semana
    const diff = day === 0 ? -6 : 1 - day; // Se domingo (0), voltar 6 dias; senão, ir para segunda
    result.setDate(result.getDate() + diff);
    return result;
  }

  getEndOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    // Ajustar para domingo ser o fim da semana
    const diff = day === 0 ? 0 : 7 - day; // Se domingo (0), não mover; senão, ir para próximo domingo
    result.setDate(result.getDate() + diff);
    return result;
  }

  getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  // Formatação
  formatDate(date: Date, format: string = 'dd/MM/yyyy'): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month];
  }

  getDayName(day: number): string {
    // Ajustado para segunda-feira = 0, domingo = 6
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    // Converter JS day (dom=0, seg=1...) para nosso formato (seg=0, dom=6)
    const adjustedDay = day === 0 ? 6 : day - 1;
    return days[adjustedDay];
  }

  getFullDayName(day: number): string {
    // Ajustado para segunda-feira = 0, domingo = 6
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    // Converter JS day (dom=0, seg=1...) para nosso formato (seg=0, dom=6)
    const adjustedDay = day === 0 ? 6 : day - 1;
    return days[adjustedDay];
  }

  // Métodos para obter períodos
  getCurrentMonthRange(): { start: Date, end: Date } {
    const currentDate = this.getCurrentDate();
    return {
      start: this.getStartOfMonth(currentDate),
      end: this.getEndOfMonth(currentDate)
    };
  }

  getCurrentWeekRange(): { start: Date, end: Date } {
    const currentDate = this.getCurrentDate();
    return {
      start: this.getStartOfWeek(currentDate),
      end: this.getEndOfWeek(currentDate)
    };
  }

  getCurrentDayRange(): { start: Date, end: Date } {
    const currentDate = this.getCurrentDate();
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
}

