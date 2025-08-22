export interface User {
  id: string;
  name: string;
  email: string;
  color: string; // cor padrão para eventos do usuário
  avatar?: string;
  createdAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  color: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  name?: string;
  color?: string;
  avatar?: string;
}

