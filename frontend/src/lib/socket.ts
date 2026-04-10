import { io, Socket } from 'socket.io-client';

let socket: Socket;

// Dev → servidor local directo.
// Prod con VITE_API_URL → backend en otro dominio (Railway).
// Prod sin VITE_API_URL → mismo dominio que el frontend (Docker/nginx).
const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:4000'
  : (import.meta.env.VITE_API_URL ?? window.location.origin);

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      // El token se lee en cada intento de conexión para soportar refresh automático
      auth: (cb) => {
        cb({ token: localStorage.getItem('imss_access_token') ?? '' });
      },
    });
  }
  return socket;
}
