import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { RecurrenceType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TestEventService {
  constructor(private firestore: Firestore) {}

  async createTestEvent(): Promise<void> {
    const eventsCollection = collection(this.firestore, 'events');
    
    const testEvent = {
      name: 'Evento de Teste',
      color: '#2196f3',
      startTime: Timestamp.fromDate(new Date(2024, 11, 15, 10, 0)), // 15 dez 2024, 10:00
      endTime: Timestamp.fromDate(new Date(2024, 11, 15, 11, 0)),   // 15 dez 2024, 11:00
      date: Timestamp.fromDate(new Date(2024, 11, 15)),              // 15 dez 2024
      recurrence: RecurrenceType.NONE,
      location: 'Sala de Reunião',
      notes: 'Evento criado para teste',
      userId: 'test-user-1',
      participants: ['test-user-2'],
      isShared: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    try {
      const docRef = await addDoc(eventsCollection, testEvent);
      console.log('Evento de teste criado com ID:', docRef.id);
    } catch (error) {
      console.error('Erro ao criar evento de teste:', error);
    }
  }
}
