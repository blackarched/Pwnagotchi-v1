import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { Server as SocketIOServer } from 'socket.io';
// import { WebSocketServer } from 'ws'; // No longer needed if Socket.IO is primary
// import { createProxyServer } from 'http-proxy'; // No longer needed

// load environment
dotenv.config();

// Initialize Pwnagotchi Service (must be after dotenv.config())
import { initPwnagotchiService } from './lib/pwnagotchiService.js';
initPwnagotchiService();

import promClient from 'prom-client';

const {
  BACKEND_PORT = 3001,
  CORS_ORIGIN,
  LOG_LEVEL = 'info',
  // PWNAGOTCHI_HOST, // Will be used by pwnagotchiService.js
  // PWNAGOTCHI_USER,
  // PWNAGOTCHI_SSH_KEY_PATH,
  // PWNAGOTCHI_API_BASE_URL, // Will be used by pwnagotchiService.js if direct API calls are made
  WEBSOCKET_PATH = '/socket.io', // Will be used by Socket.io server
  ENABLE_METRICS = 'true', // Enable metrics endpoint by default
} = process.env;

// Prometheus Metrics Setup
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();
collectDefaultMetrics({ register }); // Collects default Node.js metrics

// Custom Metrics
const pwnagotchiHandshakesTotal = new promClient.Counter({
  name: 'pwnagotchi_handshakes_total',
  help: 'Total number of handshakes captured by Pwnagotchi and reported by the application.',
  registers: [register],
});

const pwnagotchiNetworksDetectedTotal = new promClient.Gauge({
  name: 'pwnagotchi_networks_detected_gauge', // Using Gauge as this can go up or down based on current scan
  help: 'Current number of unique networks detected by Pwnagotchi in the current session/scan.',
  registers: [register],
});

const pwnagotchiApiRequestsTotal = new promClient.Counter({
  name: 'pwnagotchi_backend_api_requests_total',
  help: 'Total number of requests to the backend API.',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const pwnagotchiWebsocketConnections = new promClient.Gauge({
  name: 'pwnagotchi_backend_websocket_connections_active',
  help: 'Current number of active WebSocket connections.',
  registers: [register],
});


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
  const startEpoch = Date.now();
  logger.info({ msg: 'http_request', method: req.method, path: req.path, origin: req.headers.origin });

  res.on('finish', () => {
    const responseTime = Date.now() - startEpoch;
    pwnagotchiApiRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path, // req.route might be undefined for 404s
      status_code: res.statusCode
    });
    logger.info({ msg: 'http_response', method: req.method, path: req.path, status: res.statusCode, duration_ms: responseTime });
  });
  next();
});

// Metrics endpoint
if (ENABLE_METRICS === 'true') {
  app.get('/metrics', async (req, res, next) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      logger.error('Error serving metrics:', ex);
      res.status(500).end(ex.toString());
    }
  });
  logger.info('Prometheus metrics endpoint enabled at /metrics');
} else {
  logger.info('Prometheus metrics endpoint is disabled.');
}

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

// Initialize Socket.IO server
const io = new SocketIOServer(server, {
  path: WEBSOCKET_PATH, // Uses WEBSOCKET_PATH from .env
  cors: corsOptions,     // Uses the same CORS options as Express
  serveClient: false,     // We serve the client via the frontend Nginx
});

logger.info(`Socket.IO server initialized on path: ${WEBSOCKET_PATH}`);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info({ msg: 'socket_io_client_connected', id: socket.id, remoteAddress: socket.handshake.address });
  pwnagotchiWebsocketConnections.inc(); // Increment active connections

  // Example: Send a welcome message
  socket.emit('server_message', { message: 'Welcome to the Pwnagotchi Dashboard WebSocket!' });

  // Placeholder for handling client commands or messages
  socket.on('client_command', (data) => {
    logger.info({ msg: 'socket_io_client_command', id: socket.id, command: data });
    // Process command, possibly using pwnagotchiService.js
    // Example: socket.emit('command_response', { status: 'executed', detail: ... });
  });

  socket.on('disconnect', (reason) => {
    logger.info({ msg: 'socket_io_client_disconnected', id: socket.id, reason: reason });
    pwnagotchiWebsocketConnections.dec(); // Decrement active connections
  });

  socket.on('error', (error) => {
    logger.error({ msg: 'socket_io_client_error', id: socket.id, error: error.message, stack: error.stack });
  });
});


// Placeholder for Pwnagotchi event polling/push logic
// This is where we'll integrate with pwnagotchiService.js to get updates
// and then io.emit() or io.to(room).emit() those updates.

const PWNAGOTCHI_POLL_INTERVAL = parseInt(process.env.PWNAGOTCHI_POLL_INTERVAL_MS, 10) || 5000; // Default 5 seconds

// Example of how to structure polling for new handshakes (actual implementation details will vary)
// async function pollForPwnagotchiUpdates() {
//   try {
//     logger.debug('Polling for Pwnagotchi updates...');
//     // 1. Fetch new handshakes (e.g., using a timestamp or sequence number)
//     // const { stdout, stderr, code } = await executePwnagotchiCommand('pwnagotchi-cli handshakes recent --since <last_timestamp_or_id>');
//     // if (code === 0 && stdout) {
//     //   const newHandshakes = parseRecentHandshakes(stdout); // You'll need a robust parser
//     //   if (newHandshakes && newHandshakes.length > 0) {
//     //     logger.info(`Found ${newHandshakes.length} new handshakes. Broadcasting...`);
//     //     io.emit('handshakes:new', newHandshakes); // Or 'handshakes:update'
//     //     // Update last_timestamp_or_id
//     //   }
//     // }
//
//     // 2. Fetch network updates
//     // const networks = await getPwnagotchiApiData('/api/v1/units'); // or CLI
//     // if (networks) {
//     //    io.emit('networks:update', networks);
//     // }
//
//     // 3. Fetch AI status
//     // const aiStatus = await getPwnagotchiApiData('/api/v1/status-display'); // or CLI for mood/status
//     // if (aiStatus) {
//     //    io.emit('ai:status', aiStatus);
//     // }
//
//     // 4. Fetch new logs (this is tricky, could involve tailing a log file via SSH)
//     // logger.debug('Log polling not yet implemented.');
//
//   } catch (error) {
//     logger.error('Error during Pwnagotchi polling loop:', { message: error.message, stack: error.stack });
//   }
import { executePwnagotchiCommand, getPwnagotchiApiData, parseRecentHandshakes, parseUnits, parseAIStatus } from './lib/pwnagotchiService.js';

// Keep track of last fetched data to emit only diffs or based on actual changes
// This is a simplistic approach; a more robust system might use etags, last-modified, or sequence numbers from the Pwnagotchi
let lastKnownHandshakes = [];
let lastKnownNetworks = [];
let lastKnownAIStatus = {};


async function pollForPwnagotchiUpdates() {
  try {
    logger.debug('Polling for Pwnagotchi updates...');

    // 1. Fetch Handshakes
    // Prioritize API if available, fallback to CLI
    let handshakesData;
    if (process.env.PWNAGOTCHI_API_BASE_URL) {
      // Assuming an API endpoint for recent handshakes, e.g., /api/v1/handshakes/recent
      // This specific endpoint is hypothetical for handshakes via API.
      // handshakesData = await getPwnagotchiApiData('/api/v1/handshakes/recent');
      // For now, let's stick to CLI for handshakes as it's more commonly exposed this way by pwnagotchi
    }
    // Fallback or primary method: CLI
    if (!handshakesData) {
      const handshakeResult = await executePwnagotchiCommand('pwnagotchi-cli handshakes recent'); // Adjust command as needed
      if (handshakeResult.code === 0 && handshakeResult.stdout) {
        handshakesData = parseRecentHandshakes(handshakeResult.stdout);
      } else {
        logger.warn(`Failed to fetch handshakes via CLI: ${handshakeResult.stderr || 'No output'}`);
      }
    }

    if (handshakesData) {
      // Basic diffing or just emit the latest set
      const newHandshakesCount = handshakesData.filter(h =>
        !lastKnownHandshakes.some(old_h => JSON.stringify(old_h) === JSON.stringify(h))
      ).length;

      if (newHandshakesCount > 0 || handshakesData.length !== lastKnownHandshakes.length) {
         // Update metric only if there are genuinely new items or the list length changed
        pwnagotchiHandshakesTotal.inc(newHandshakesCount); // Increment by the number of new handshakes
        logger.info(`Found ${handshakesData.length} handshakes (${newHandshakesCount} new). Broadcasting...`);
        io.emit('handshakes:update', handshakesData);
        lastKnownHandshakes = JSON.parse(JSON.stringify(handshakesData)); // Deep copy
      }
    }

    // 2. Fetch Network Updates (Units)
    let networksData;
    if (process.env.PWNAGOTCHI_API_BASE_URL) {
      networksData = await getPwnagotchiApiData('/api/v1/units'); // As per existing grid.js
    } else {
      const networkResult = await executePwnagotchiCommand('pwnagotchi-cli units'); // Hypothetical
      if (networkResult.code === 0 && networkResult.stdout) {
        networksData = parseUnits(networkResult.stdout);
      } else {
        logger.warn(`Failed to fetch networks via CLI: ${networkResult.stderr || 'No output'}`);
      }
    }
    if (networksData) {
      pwnagotchiNetworksDetectedTotal.set(networksData.length); // Set to current count
      if (JSON.stringify(networksData) !== JSON.stringify(lastKnownNetworks)) {
        logger.info(`Found ${networksData.length} networks. Broadcasting...`);
        io.emit('networks:update', networksData);
        lastKnownNetworks = JSON.parse(JSON.stringify(networksData)); // Deep copy
      }
    }

    // 3. Fetch AI Status
    let aiStatusData;
    if (process.env.PWNAGOTCHI_API_BASE_URL) {
      // Common Pwnagotchi API endpoint for display status
      aiStatusData = await getPwnagotchiApiData('/api/v1/status-display');
    } else {
      const aiStatusResult = await executePwnagotchiCommand('pwnagotchi-cli status'); // Hypothetical
      if (aiStatusResult.code === 0 && aiStatusResult.stdout) {
        aiStatusData = parseAIStatus(aiStatusResult.stdout);
      } else {
        logger.warn(`Failed to fetch AI status via CLI: ${aiStatusResult.stderr || 'No output'}`);
      }
    }
    if (aiStatusData) {
       if (JSON.stringify(aiStatusData) !== JSON.stringify(lastKnownAIStatus)) {
        logger.info('AI status change detected. Broadcasting...', aiStatusData);
        io.emit('ai:status', aiStatusData);
        lastKnownAIStatus = aiStatusData;
      }
    }

    // 4. Fetch new logs (This is more complex and might require different strategies like tailing a log file)
    // For now, we'll skip live log streaming via polling in this iteration.
    // logger.debug('Live log polling not implemented in this cycle.');

  } catch (error) {
    logger.error('Error during Pwnagotchi polling loop:', { message: error.message, stack: error.stack });
  }
}

if (process.env.ENABLE_PWNAGOTCHI_POLLING === 'true') {
  logger.info(`Pwnagotchi polling enabled. Interval: ${PWNAGOTCHI_POLL_INTERVAL}ms`);
  setInterval(pollForPwnagotchiUpdates, PWNAGOTCHI_POLL_INTERVAL);
  pollForPwnagotchiUpdates(); // Initial poll
} else {
  logger.info('Pwnagotchi polling is disabled via environment variable (ENABLE_PWNAGOTCHI_POLLING).');
}


logger.info(`Backend server started. Process PID: ${process.pid}`);
export default server; // Export for potential testing or programmatic use
