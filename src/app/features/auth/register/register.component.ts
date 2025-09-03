import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person_add</mat-icon>
            Criar Conta
          </mat-card-title>
          <mat-card-subtitle>Cadastre-se para usar o Multi Agenda</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome</mat-label>
              <input matInput type="text" formControlName="name" required>
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="registerForm.get('name')?.hasError('required')">
                Nome é obrigatório
              </mat-error>
              <mat-error *ngIf="registerForm.get('name')?.hasError('minlength')">
                Nome deve ter pelo menos 2 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email é obrigatório
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Email inválido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Senha é obrigatória
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Senha deve ter pelo menos 6 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Senha</mat-label>
              <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword" required>
              <button mat-icon-button matSuffix (click)="hideConfirmPassword = !hideConfirmPassword" type="button">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                Confirmação de senha é obrigatória
              </mat-error>
              <mat-error *ngIf="registerForm.hasError('passwordMismatch')">
                Senhas não coincidem
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Cor do Perfil</mat-label>
              <mat-select formControlName="color" required>
                <mat-option *ngFor="let color of availableColors" [value]="color.value">
                  <div class="color-option">
                    <div class="color-circle" [style.background-color]="color.value"></div>
                    {{ color.name }}
                  </div>
                </mat-option>
              </mat-select>
              <mat-error *ngIf="registerForm.get('color')?.hasError('required')">
                Selecione uma cor
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    class="full-width register-button" 
                    [disabled]="registerForm.invalid || isLoading">
              <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
              <span *ngIf="!isLoading">Cadastrar</span>
              <span *ngIf="isLoading">Cadastrando...</span>
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <p style="text-align: center; width: 100%;">Já tem uma conta? 
            <a routerLink="/login" class="login-link">Faça login</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 16px;
      overflow: auto;
    }

    .register-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }

    .register-card mat-card-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .register-card mat-card-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 24px;
      margin-bottom: 8px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .register-button {
      height: 48px;
      font-size: 16px;
      margin-top: 16px;
    }

    .login-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
    }

    .login-link:hover {
      text-decoration: underline;
    }

    mat-card-actions p {
      margin: 0;
      text-align: center;
      width: 100%;
    }

    .color-option {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .color-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #ccc;
    }

    @media (max-width: 480px) {
      .register-container {
        padding: 8px;
      }
      
      .register-card {
        padding: 16px;
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  availableColors = [
    { name: 'Vermelho', value: '#f44336' },
    { name: 'Rosa', value: '#e91e63' },
    { name: 'Roxo', value: '#9c27b0' },
    { name: 'Azul Escuro', value: '#673ab7' },
    { name: 'Índigo', value: '#3f51b5' },
    { name: 'Azul', value: '#2196f3' },
    { name: 'Azul Claro', value: '#03a9f4' },
    { name: 'Ciano', value: '#00bcd4' },
    { name: 'Verde Azulado', value: '#009688' },
    { name: 'Verde', value: '#4caf50' },
    { name: 'Verde Claro', value: '#8bc34a' },
    { name: 'Lima', value: '#cddc39' },
    { name: 'Amarelo', value: '#ffeb3b' },
    { name: 'Âmbar', value: '#ffc107' },
    { name: 'Laranja', value: '#ff9800' },
    { name: 'Laranja Escuro', value: '#ff5722' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      color: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Redirecionar se já estiver logado
    this.authService.authStateSubject.subscribe(user => {
      if (user) {
        this.router.navigate(['/calendar']);
      }
    });

    // Sugerir uma cor padrão
    const suggestedColor = this.userService.suggestColor([]);
    this.registerForm.patchValue({ color: suggestedColor });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit() {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      try {
        const { name, email, password, color } = this.registerForm.value;
        await this.authService.signUp(email, password, name, color);
        
        this.snackBar.open('Conta criada com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.router.navigate(['/calendar']);
      } catch (error: any) {
        this.snackBar.open(error.message || 'Erro ao criar conta', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } finally {
        this.isLoading = false;
      }
    }
  }
}

