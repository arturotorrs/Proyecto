require('dotenv').config();
const http = require('http');
const app = require('./app');
const { init } = require('./socket');
const { startAlertasService } = require('./services/alertas.service');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
init(server);
startAlertasService();

server.listen(PORT, () => {
  console.log(`Servidor IMSS Inventario corriendo en http://localhost:${PORT}`);
});
