import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user, User as FirebaseUser, onAuthStateChanged } from '@angular/fire/auth';
import { Observable, from, map, switchMap, of, BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$ = user(this.auth);
  currentUser$: Observable<User | null>;
  public authStateSubject = new BehaviorSubject<FirebaseUser | null>(null);

  constructor(
    private auth: Auth,
    private userService: UserService
  ) {
    // Inicializar o estado de autenticação
    onAuthStateChanged(this.auth, (user) => {
      this.authStateSubject.next(user);
    });

    this.currentUser$ = this.authStateSubject.pipe(
      switchMap(firebaseUser => {
        if (firebaseUser) {
          return this.userService.getUser(firebaseUser.uid);
        } else {
          return of(null);
        }
      })
    );
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signUp(email: string, password: string, name: string, color: string): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Criar perfil do usuário no Firestore
      await this.userService.createUser({
        name,
        email,
        color
      }, credential.user.uid);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  private handleAuthError(error: any): Error {
    let message = 'Erro de autenticação';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Usuário não encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Senha incorreta';
        break;
      case 'auth/email-already-in-use':
        message = 'Email já está em uso';
        break;
      case 'auth/weak-password':
        message = 'Senha muito fraca';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      default:
        message = error.message || 'Erro desconhecido';
    }
    
    return new Error(message);
  }
}

