import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { WebSocketServer } from 'ws';
import { createProxyServer } from 'http-proxy';

// load environment
dotenv.config();
const {
  BACKEND_PORT = 3001,
  CORS_ORIGIN,
  LOG_LEVEL = 'info',
  // PWNAGOTCHI_HOST, // Will be used by pwnagotchiService.js
  // PWNAGOTCHI_USER,
  // PWNAGOTCHI_SSH_KEY_PATH,
  // PWNAGOTCHI_API_BASE_URL, // Will be used by pwnagotchiService.js if direct API calls are made
  WEBSOCKET_PATH = '/socket.io', // Will be used by Socket.io server
} = process.env;

// Basic check for essential Pwnagotchi connection details for later use
// if (!PWNAGOTCHI_HOST || !PWNAGOTCHI_USER) {
//   console.error('❌ Must set PWNAGOTCHI_HOST and PWNAGOTCHI_USER in .env for direct Pwnagotchi interaction.');
//   // process.exit(1); // Deferred until pwnagotchiService requires it
// }

// logger
const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(format.timestamp(), format.json()),
  transports: [ new transports.Console() ],
});

const app = express();
app.use(express.json());

// Configure CORS
const corsOptions = {
  origin: CORS_ORIGIN ? CORS_ORIGIN.split(',') : true, // Defaults to allowing all if not specified, adjust as needed for production
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true, // Important for cookies if used in auth, and for some Socket.IO scenarios
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  logger.info({ msg: 'http_request', method: req.method, path: req.path, origin: req.headers.origin });
  next();
});

// routers
import meshRouter from './routes/mesh.js';
import gridRouter from './routes/grid.js';
import mailRouter from './routes/pwnmail.js';
// import pwnagotchiRouter from './routes/pwnagotchi.js'; // Example for future direct Pwnagotchi control if needed

app.get('/healthz', (req, res) => res.status(200).send('OK')); // Basic health check

app.use('/api/mesh', meshRouter); // These routes will be refactored to use pwnagotchiService.js
app.use('/api', gridRouter);     // instead of direct proxying.
app.use('/api', mailRouter);
// app.use('/api/pwnagotchi', pwnagotchiRouter);


// error handler
app.use((err, req, res, next) => {
  logger.error({ msg: 'unhandled_error', error: err.message, path: req.path, stack: err.stack });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// start server
const server = app.listen(BACKEND_PORT, () => {
  logger.info({ msg: 'server_listening', port: BACKEND_PORT });
});

// WebSocket server (to be implemented with Socket.io in Phase 2)
// For now, removing the old ws proxy. A new Socket.IO server will be attached to `server`.
// const wsProxy = createProxyServer({ target: PWN_WS_URL, ws: true, changeOrigin: true });
// const wss = new WebSocketServer({ server, path: '/socket' }); // Old path, will use WEBSOCKET_PATH

// wss.on('connection', (client, req) => {
//   logger.info({ msg: 'ws_connection', remote: req.socket.remoteAddress });
//   wsProxy.ws(req, client, client.upgradeReq);
//   client.on('close', () => logger.info({ msg: 'ws_close' }));
//   client.on('error', err => logger.error({ msg: 'ws_error', error: err.message }));
// });

// Placeholder for Socket.IO server initialization (Phase 2)
// import { Server as SocketIOServer } from 'socket.io';
// const io = new SocketIOServer(server, {
//   path: WEBSOCKET_PATH,
//   cors: corsOptions,
// });

// io.on('connection', (socket) => {
//   logger.info({ msg: 'socket_io_connection', id: socket.id });
//   // Handle Socket.IO events here
//   socket.on('disconnect', () => {
//     logger.info({ msg: 'socket_io_disconnect', id: socket.id });
//   });
// });

logger.info(`Backend server started. Process PID: ${process.pid}`);
export default server; // Export for potential testing or programmatic use
