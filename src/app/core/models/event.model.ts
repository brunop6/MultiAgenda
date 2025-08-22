export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface Event {
  id: string;
  name: string;
  color: string;
  startTime: Date;
  endTime: Date;
  date: Date;
  recurrence: RecurrenceType;
  location?: string;
  notes?: string;
  userId: string; // criador do evento
  participants: string[]; // IDs dos participantes
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRequest {
  name: string;
  color: string;
  startTime: Date;
  endTime: Date;
  date: Date;
  recurrence: RecurrenceType;
  location?: string;
  notes?: string;
  participants: string[];
  isShared: boolean;
}

export interface UpdateEventRequest {
  name?: string;
  color?: string;
  startTime?: Date;
  endTime?: Date;
  date?: Date;
  recurrence?: RecurrenceType;
  location?: string;
  notes?: string;
  participants?: string[];
  isShared?: boolean;
}

export interface EventFilter {
  userIds?: string[];
  startDate?: Date;
  endDate?: Date;
  includeShared?: boolean;
}

export interface CalendarEvent extends Event {
  displayText: string;
  isMultiDay: boolean;
  duration: number; // em minutos
}

