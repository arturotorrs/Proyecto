import apiClient from '../lib/axios';
import type { AuthResponse } from '../types';

export const loginApi = (email: string, password: string) =>
  apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data);

export const refreshTokenApi = (refreshToken: string) =>
  apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data);

export const logoutApi = () =>
  apiClient.post('/auth/logout').then((r) => r.data);

export const forgotPasswordApi = (email: string) =>
  apiClient.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPasswordApi = (token: string, password: string) =>
  apiClient.post<{ message: string }>('/auth/reset-password', { token, password }).then((r) => r.data);
