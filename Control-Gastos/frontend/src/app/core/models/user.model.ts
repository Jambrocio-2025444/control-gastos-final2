export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'user';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}