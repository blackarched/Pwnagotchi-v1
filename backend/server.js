import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { WebSocketServer } from 'ws';
import { createProxyServer } from 'http-proxy';

// load environment
dotenv.config();
const {
  PORT = 3000,
  CORS_ORIGIN,
  PWN_API_URL,
  PWN_WS_URL
} = process.env;

if (!PWN_API_URL || !PWN_WS_URL) {
  console.error('❌ Must set PWN_API_URL and PWN_WS_URL in .env');
  process.exit(1);
}

// logger
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [ new transports.Console() ],
});

const app = express();
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGIN?.split(','),
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
}));
app.use((req, res, next) => {
  logger.info({ msg: 'http_request', method: req.method, path: req.path });
  next();
});

// routers
import meshRouter from './routes/mesh.js';
import gridRouter from './routes/grid.js';
import mailRouter from './routes/pwnmail.js';

app.use('/api/mesh', meshRouter);
app.use('/api', gridRouter);
app.use('/api', mailRouter);

// error handler
app.use((err, req, res, next) => {
  logger.error({ msg: 'unhandled_error', error: err.stack || err });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// start server
const server = app.listen(PORT, () => {
  logger.info({ msg: 'server_listening', port: PORT });
});

// WebSocket proxy
const wsProxy = createProxyServer({ target: PWN_WS_URL, ws: true, changeOrigin: true });
const wss = new WebSocketServer({ server, path: '/socket' });

wss.on('connection', (client, req) => {
  logger.info({ msg: 'ws_connection', remote: req.socket.remoteAddress });
  wsProxy.ws(req, client, client.upgradeReq);
  client.on('close', () => logger.info({ msg: 'ws_close' }));
  client.on('error', err => logger.error({ msg: 'ws_error', error: err.message }));
});
