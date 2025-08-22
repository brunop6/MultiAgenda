import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, Timestamp } from '@angular/fire/firestore';
import { Observable, from, map, BehaviorSubject } from 'rxjs';
import { User, CreateUserRequest, UpdateUserRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersCollection = collection(this.firestore, 'users');
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.loadUsers();
  }

  async createUser(userData: CreateUserRequest, userId?: string): Promise<string> {
    try {
      const userDoc = {
        ...userData,
        createdAt: Timestamp.now()
      };

      if (userId) {
        // Usar ID específico (para usuários autenticados)
        const userRef = doc(this.firestore, 'users', userId);
        await setDoc(userRef, userDoc);
        this.loadUsers(); // Recarregar lista
        return userId;
      } else {
        // Gerar ID automático
        const docRef = await addDoc(this.usersCollection, userDoc);
        this.loadUsers(); // Recarregar lista
        return docRef.id;
      }
    } catch (error) {
      throw new Error('Erro ao criar usuário: ' + error);
    }
  }

  getUser(userId: string): Observable<User | null> {
    return from(getDoc(doc(this.firestore, 'users', userId))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date()
          } as User;
        }
        return null;
      })
    );
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      await updateDoc(userRef, userData as any);
      this.loadUsers(); // Recarregar lista
    } catch (error) {
      throw new Error('Erro ao atualizar usuário: ' + error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      await deleteDoc(userRef);
      this.loadUsers(); // Recarregar lista
    } catch (error) {
      throw new Error('Erro ao excluir usuário: ' + error);
    }
  }

  getAllUsers(): Observable<User[]> {
    return this.users$;
  }

  private async loadUsers(): Promise<void> {
    try {
      const q = query(this.usersCollection, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const users: User[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate() || new Date()
        } as User);
      });
      
      this.usersSubject.next(users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      this.usersSubject.next([]);
    }
  }

  // Método para obter cores padrão para novos usuários
  getDefaultColors(): string[] {
    return [
      '#f44336', // Red
      '#e91e63', // Pink
      '#9c27b0', // Purple
      '#673ab7', // Deep Purple
      '#3f51b5', // Indigo
      '#2196f3', // Blue
      '#03a9f4', // Light Blue
      '#00bcd4', // Cyan
      '#009688', // Teal
      '#4caf50', // Green
      '#8bc34a', // Light Green
      '#cddc39', // Lime
      '#ffeb3b', // Yellow
      '#ffc107', // Amber
      '#ff9800', // Orange
      '#ff5722'  // Deep Orange
    ];
  }

  // Método para sugerir uma cor disponível
  suggestColor(existingUsers: User[]): string {
    const defaultColors = this.getDefaultColors();
    const usedColors = existingUsers.map(user => user.color);
    
    const availableColor = defaultColors.find(color => !usedColors.includes(color));
    return availableColor || defaultColors[Math.floor(Math.random() * defaultColors.length)];
  }
}

