const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Autenticar el socket con el mismo JWT del API REST
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token requerido'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user_id = decoded.id;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    // Cada usuario entra a su sala privada
    socket.join(`user:${socket.user_id}`);
    console.log(`Cliente conectado: ${socket.id} (user ${socket.user_id})`);
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io no inicializado');
  return io;
}

module.exports = { init, getIO };
