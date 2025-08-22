import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, and, or } from '@angular/fire/firestore';
import { Observable, from, map, BehaviorSubject, combineLatest } from 'rxjs';
import { Event, CreateEventRequest, UpdateEventRequest, EventFilter, CalendarEvent, RecurrenceType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsCollection = collection(this.firestore, 'events');
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();
  private isLoading = false;

  constructor(private firestore: Firestore) {
    console.log('EventService: Constructor called, firestore:', firestore);
    this.loadEvents();
  }

  async createEvent(eventData: CreateEventRequest, userId: string): Promise<string> {
    try {
      const eventDoc = {
        ...eventData,
        userId,
        startTime: Timestamp.fromDate(eventData.startTime),
        endTime: Timestamp.fromDate(eventData.endTime),
        date: Timestamp.fromDate(eventData.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(this.eventsCollection, eventDoc);
      this.loadEvents(); // Recarregar lista
      return docRef.id;
    } catch (error) {
      throw new Error('Erro ao criar evento: ' + error);
    }
  }

  getEvent(eventId: string): Observable<Event | null> {
    return from(getDoc(doc(this.firestore, 'events', eventId))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return this.mapDocToEvent(docSnap.id, docSnap.data());
        }
        return null;
      })
    );
  }

  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<void> {
    try {
      const updateData: any = {
        ...eventData,
        updatedAt: Timestamp.now()
      };

      // Converter datas para Timestamp se fornecidas
      if (eventData.startTime) {
        updateData.startTime = Timestamp.fromDate(eventData.startTime);
      }
      if (eventData.endTime) {
        updateData.endTime = Timestamp.fromDate(eventData.endTime);
      }
      if (eventData.date) {
        updateData.date = Timestamp.fromDate(eventData.date);
      }

      const eventRef = doc(this.firestore, 'events', eventId);
      await updateDoc(eventRef, updateData);
      this.loadEvents(); // Recarregar lista
    } catch (error) {
      throw new Error('Erro ao atualizar evento: ' + error);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(this.firestore, 'events', eventId);
      await deleteDoc(eventRef);
      this.loadEvents(); // Recarregar lista
    } catch (error) {
      throw new Error('Erro ao excluir evento: ' + error);
    }
  }

  getEventsByFilter(filter: EventFilter): Observable<Event[]> {
    return from(this.queryEventsByFilter(filter));
  }

  getEventsByDateRange(startDate: Date, endDate: Date, userIds?: string[]): Observable<Event[]> {
    const filter: EventFilter = {
      startDate,
      endDate,
      userIds,
      includeShared: true
    };
    return this.getEventsByFilter(filter);
  }

  getEventsForUser(userId: string, startDate?: Date, endDate?: Date): Observable<Event[]> {
    const filter: EventFilter = {
      userIds: [userId],
      startDate,
      endDate,
      includeShared: true
    };
    return this.getEventsByFilter(filter);
  }

  private async queryEventsByFilter(filter: EventFilter): Promise<Event[]> {
    try {
      console.log('Consultando eventos com filtro:', filter);
      let q = query(this.eventsCollection);

      // Filtro por data
      if (filter.startDate && filter.endDate) {
        console.log('Aplicando filtro de data:', filter.startDate, 'até', filter.endDate);
        q = query(q, 
          where('date', '>=', Timestamp.fromDate(filter.startDate)),
          where('date', '<=', Timestamp.fromDate(filter.endDate))
        );
      }

      // Ordenar por data
      q = query(q, orderBy('date'), orderBy('startTime'));

      console.log('Executando query...');
      const querySnapshot = await getDocs(q);
      const events: Event[] = [];

      console.log('Total de documentos encontrados:', querySnapshot.size);

      querySnapshot.forEach(doc => {
        const event = this.mapDocToEvent(doc.id, doc.data());
        console.log('Evento encontrado:', event);
        
        // Filtrar por usuários se especificado
        if (filter.userIds && filter.userIds.length > 0) {
          const isUserEvent = filter.userIds.includes(event.userId);
          const isParticipant = event.participants.some(p => filter.userIds!.includes(p));
          const isSharedAndIncluded = event.isShared && filter.includeShared;
          
          console.log('Verificando filtros - isUserEvent:', isUserEvent, 'isParticipant:', isParticipant, 'isSharedAndIncluded:', isSharedAndIncluded);
          
          if (isUserEvent || isParticipant || isSharedAndIncluded) {
            events.push(event);
          }
        } else {
          events.push(event);
        }
      });

      console.log('Eventos após filtros:', events);
      return events;
    } catch (error) {
      console.error('Erro ao consultar eventos:', error);
      return [];
    }
  }

  private async loadEvents(): Promise<void> {
    if (this.isLoading) {
      console.log('EventService: Já está carregando eventos, ignorando...');
      return;
    }
    
    this.isLoading = true;
    
    try {
      console.log('EventService: Iniciando carregamento de eventos...');
      
      // Query simples para buscar todos os eventos
      const querySnapshot = await getDocs(this.eventsCollection);
      
      const baseEvents: Event[] = [];
      const seenIds = new Set<string>();
      
      querySnapshot.forEach(doc => {
        if (!seenIds.has(doc.id)) {
          console.log('EventService: Documento encontrado:', doc.id, doc.data());
          baseEvents.push(this.mapDocToEvent(doc.id, doc.data()));
          seenIds.add(doc.id);
        } else {
          console.log('EventService: Documento duplicado ignorado:', doc.id);
        }
      });
      
      console.log('EventService: Total de eventos base encontrados:', baseEvents.length);
      
      // Gerar eventos recorrentes para os próximos 6 meses
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      
      const allEvents: Event[] = [];
      
      baseEvents.forEach(baseEvent => {
        if (baseEvent.recurrence && baseEvent.recurrence !== RecurrenceType.NONE) {
          // Gerar eventos recorrentes
          const recurringEvents = this.generateRecurringEvents(baseEvent, endDate);
          allEvents.push(...recurringEvents);
          console.log(`EventService: Gerados ${recurringEvents.length} eventos recorrentes para "${baseEvent.name}"`);
        } else {
          // Evento único
          allEvents.push(baseEvent);
        }
      });
      
      console.log('EventService: Total de eventos (incluindo recorrentes):', allEvents.length);
      this.eventsSubject.next(allEvents);
    } catch (error) {
      console.error('EventService: Erro ao carregar eventos:', error);
      this.eventsSubject.next([]);
    } finally {
      this.isLoading = false;
    }
  }

  public async reloadEvents(): Promise<void> {
    this.isLoading = false; // Reset para permitir recarregamento
    return this.loadEvents();
  }

  private mapDocToEvent(id: string, data: any): Event {
    return {
      id,
      name: data.name,
      color: data.color,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate() || new Date(),
      date: data.date?.toDate() || new Date(),
      recurrence: data.recurrence || RecurrenceType.NONE,
      location: data.location,
      notes: data.notes,
      userId: data.userId,
      participants: data.participants || [],
      isShared: data.isShared || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  // Método para converter Event em CalendarEvent
  toCalendarEvent(event: Event): CalendarEvent {
    const duration = Math.floor((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60));
    const isMultiDay = event.startTime.toDateString() !== event.endTime.toDateString();
    
    return {
      ...event,
      displayText: this.formatEventDisplayText(event),
      isMultiDay,
      duration
    };
  }

  private formatEventDisplayText(event: Event): string {
    const startTime = event.startTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = event.endTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${startTime} - ${endTime} ${event.name}`;
  }

  // Método para gerar eventos recorrentes
  generateRecurringEvents(baseEvent: Event, endDate: Date): Event[] {
    const events: Event[] = [baseEvent];
    
    if (baseEvent.recurrence === RecurrenceType.NONE) {
      return events;
    }

    let currentDate = new Date(baseEvent.date);
    const maxDate = new Date(endDate);
    let iteration = 0;
    const maxIterations = 100; // Limitar para evitar loops infinitos

    while (currentDate < maxDate && iteration < maxIterations) {
      iteration++;
      
      // Calcular próxima data baseada no tipo de recorrência
      switch (baseEvent.recurrence) {
        case RecurrenceType.DAILY:
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case RecurrenceType.WEEKLY:
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case RecurrenceType.MONTHLY:
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case RecurrenceType.YEARLY:
          currentDate = new Date(currentDate);
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }

      if (currentDate <= maxDate) {
        // Criar nova instância de data para startTime e endTime
        const eventStartTime = new Date(currentDate);
        eventStartTime.setHours(baseEvent.startTime.getHours(), baseEvent.startTime.getMinutes(), 0, 0);
        
        const eventEndTime = new Date(currentDate);
        eventEndTime.setHours(baseEvent.endTime.getHours(), baseEvent.endTime.getMinutes(), 0, 0);

        const recurringEvent: Event = {
          ...baseEvent,
          id: `${baseEvent.id}_${currentDate.getTime()}`,
          date: new Date(currentDate),
          startTime: eventStartTime,
          endTime: eventEndTime
        };
        events.push(recurringEvent);
      }
    }

    console.log(`Gerados ${events.length} eventos para "${baseEvent.name}" (${baseEvent.recurrence})`);
    return events;
  }
}

