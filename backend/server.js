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
import { initPwnagotchiService, streamPwnagotchiCommand, executePwnagotchiCommand, getPwnagotchiApiData, parseRecentHandshakes, parseUnits, parseAIStatus } from './lib/pwnagotchiService.js';
initPwnagotchiService();

import promClient from 'prom-client';
import apiLimiter from './middleware/rateLimiter.js'; // Import the default rate limiter
// import { sensitiveActionLimiter } from './middleware/rateLimiter.js'; // Import if specific routes need stricter limits

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

const pwnagotchiApiRequestsTotal = new promClient.Counter({ // Will be incremented in the middleware
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

const pwnagotchiConnectionStatus = new promClient.Gauge({
  name: 'pwnagotchi_connection_status',
  help: 'Connection status to the Pwnagotchi device (1 for connected, 0 for disconnected).',
  registers: [register],
});
// Initialize with disconnected status; polling loop will update it.
pwnagotchiConnectionStatus.set(0);

const pwnagotchiReportedUptime = new promClient.Gauge({
  name: 'pwnagotchi_reported_uptime_seconds',
  help: 'Uptime of the Pwnagotchi device as reported by its status.',
  registers: [register],
});
pwnagotchiReportedUptime.set(0);


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

app.get('/healthz', (req, res) => res.status(200).send('OK')); // Basic health check - should NOT be rate limited.

// Apply the general API rate limiter to all /api routes
app.use('/api', apiLimiter);

// Apply new routes (now rate-limited)
app.use('/api/mesh', meshRouter);
app.use('/api/grid', gridRouter); // Note: original path was /api, if gridRouter contains /v1/data, it becomes /api/v1/data
app.use('/api/pwnmail', mailRouter); // Changed from /api to /api/pwnmail for clarity, assuming routes within are like /v1/inbox

// If gridRouter and mailRouter define paths like '/v1/data', they will be mounted at:
// /api/grid/v1/data
// /api/pwnmail/v1/inbox
// This might require adjusting frontend API calls if they previously assumed /api/v1/data directly.
// For simplicity and to match common patterns, let's assume routes are defined within routers starting from /
// e.g. gridRouter.get('/v1/data', ...)
// If routes in grid.js start with /api, then app.use('/', gridRouter) might be used, but that's less common for modular routers.
// Sticking to the current structure:
// app.use('/api/mesh', meshRouter);
// app.use('/api/grid', gridRouter); // If grid.js has router.get('/v1/data'), it's /api/grid/v1/data
// app.use('/api/pwnmail', mailRouter); // If pwnmail.js has router.get('/v1/inbox'), it's /api/pwnmail/v1/inbox

// Let's adjust how gridRouter and mailRouter are mounted if they contain full paths like /api/v1/*
// Based on original: app.use('/api', gridRouter); and app.use('/api', mailRouter);
// This implies gridRouter might have routes like '/v1/data' and mailRouter '/v1/inbox'
// To apply limiter before these, we need to be careful.
// If apiLimiter is applied to '/api', it will cover these.

// Re-evaluating the route mounting based on original setup:
// The original had app.use('/api', gridRouter) and app.use('/api', mailRouter)
// This means gridRouter's paths like '/v1/data' would be accessible at '/api/v1/data'.
// And mailRouter's paths like '/v1/inbox' would be accessible at '/api/v1/inbox'.
// The router for mesh was specific: app.use('/api/mesh', meshRouter);

// Corrected application of routes and limiter:
app.use('/api/mesh', meshRouter); // Specific, rate limited by the '/api' limiter if meshRouter paths are relative
                                 // Or apply specific limiter here if needed: app.use('/api/mesh', sensitiveActionLimiter, meshRouter);

// For grid and pwnmail, if their internal routes are /v1/* and they were mounted on /api
// the apiLimiter on '/api' will cover them.
app.use('/api', gridRouter);     // Handles routes like /api/v1/data, /api/v1/units
app.use('/api', mailRouter);     // Handles routes like /api/v1/inbox


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
// Store active log stream commands per socket to manage them
const activeStreams = new Map(); // Stores { socketId: { command: "tail -f ...", type: 'log_stream', processPromise: Promise } }


io.on('connection', (socket) => {
  logger.info({ msg: 'socket_io_client_connected', id: socket.id, remoteAddress: socket.handshake.address });
  pwnagotchiWebsocketConnections.inc();

  socket.emit('server_message', { message: 'Welcome to the Pwnagotchi Dashboard WebSocket!' });

  socket.on('client_command', async (data) => { // Made async
    logger.info({ msg: 'socket_io_client_command', id: socket.id, command: data });
    if (data && data.command) {
      try {
        const result = await executePwnagotchiCommand(data.command);
        socket.emit('command_response', { status: 'executed', detail: result, forCommand: data.command });
      } catch (error) {
        logger.error(`Error executing client command '${data.command}': ${error.message}`);
        socket.emit('command_response', { status: 'error', detail: error.message, forCommand: data.command });
      }
    } else {
      socket.emit('command_response', { status: 'error', detail: 'Invalid command format.', forCommand: data.command })
    }
  });

  socket.on('pwnagotchi:logs:start_stream', async (data = {}) => {
    const { logFile = '/var/log/pwnagotchi.log', lines = 50 } = data; // Default log file and initial lines
    logger.info(`Client ${socket.id} requested log stream for ${logFile} (last ${lines} lines)`);

    if (activeStreams.has(socket.id)) {
      logger.warn(`Socket ${socket.id} already has an active stream. Stopping the old one (best-effort).`);
      // Placeholder for robustly killing the previous stream if possible
      activeStreams.delete(socket.id);
    }

    try {
      const tailCommand = `tail -n ${lines} -f ${logFile}`;
      // streamPwnagotchiCommand is now used. It returns a promise that resolves when the command starts.
      // The actual stream data is handled by callbacks.
      const streamProcessPromise = streamPwnagotchiCommand(
        tailCommand,
        (stdoutChunk) => { // onStdOut callback
          socket.emit('pwnagotchi:log', { line: stdoutChunk.trim() });
        },
        (stderrChunk) => { // onStdErr callback
          socket.emit('pwnagotchi:log:error', { error: stderrChunk.trim() });
          logger.warn(`Pwnagotchi log stream for ${socket.id} (file: ${logFile}) stderr: ${stderrChunk.trim()}`);
        }
      );

      activeStreams.set(socket.id, { command: tailCommand, type: 'log_stream', processPromise: streamProcessPromise });
      socket.emit('pwnagotchi:logs:stream_started', { logFile });

      // Handle the completion or error of the streamPwnagotchiCommand promise itself
      // This promise resolves when the SSH command execution is established or fails at that stage.
      // It does NOT wait for `tail -f` to end, because `tail -f` doesn't end on its own.
      streamProcessPromise.then(sshExecResult => {
        // This block executes if the `execCommand` itself completed (e.g. if `tail -f` was immediately killed or errored out)
        // For a long-running `tail -f`, this might indicate an issue if it resolves too quickly without being explicitly stopped.
        logger.info(`Log stream SSH command for ${socket.id} (file: ${logFile}) finished initial execution. Code: ${sshExecResult.code}. This is unusual for 'tail -f' unless it errored or was pre-emptively killed.`);
        // We don't delete from activeStreams here necessarily, as the stream might still be technically open
        // or the stop mechanism might be initiated by the client.
        // If code is not 0, it means `tail -f` likely failed to start properly.
        if (sshExecResult.code !== 0) {
            socket.emit('pwnagotchi:logs:stream_error', { logFile, error: `tail command failed with code ${sshExecResult.code}: ${sshExecResult.stderr}` });
            if (activeStreams.get(socket.id)?.command === tailCommand) {
              activeStreams.delete(socket.id);
            }
        }
      }).catch(err => { // Catches errors from streamPwnagotchiCommand itself (e.g., SSH connection issue)
        logger.error(`Failed to establish log stream for ${socket.id} (file: ${logFile}): ${err.message}`);
        socket.emit('pwnagotchi:logs:stream_error', { logFile, error: `Failed to establish log stream: ${err.message}` });
        if (activeStreams.get(socket.id)?.command === tailCommand) {
            activeStreams.delete(socket.id);
        }
      });

    } catch (error) { // Catch synchronous errors from trying to call streamPwnagotchiCommand
      logger.error(`Synchronous error starting log stream for ${socket.id} (file: ${logFile}): ${error.message}`);
      socket.emit('pwnagotchi:logs:stream_error', { logFile, error: `Error starting log stream: ${error.message}` });
    }
  });

  socket.on('pwnagotchi:logs:stop_stream', () => {
    logger.info(`Client ${socket.id} requested log stream stop.`);
    if (activeStreams.has(socket.id)) {
      const streamData = activeStreams.get(socket.id);
      logger.warn(`Stopping log stream for ${socket.id} (command: ${streamData.command}). The remote 'tail -f' process might not be killed by this action due to limitations with node-ssh's execCommand for long-running processes. It will stop if the SSH session ends or a new stream is started on this socket.`);
      // TODO: Implement a reliable way to kill the remote `tail -f` process if `streamPwnagotchiCommand` is adapted to support it (e.g., by managing PIDs).
      activeStreams.delete(socket.id); // Remove from tracking, effectively stopping our handling of it.
      socket.emit('pwnagotchi:logs:stream_stopped', { message: 'Log stream stop request processed. Data flow will cease. Remote process termination is best-effort.' });
    } else {
      socket.emit('pwnagotchi:logs:stream_stopped', { message: 'No active log stream to stop for this session.' });
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info({ msg: 'socket_io_client_disconnected', id: socket.id, reason: reason });
    pwnagotchiWebsocketConnections.dec();
    if (activeStreams.has(socket.id)) {
      const streamData = activeStreams.get(socket.id);
      logger.warn(`Client ${socket.id} disconnected with active stream (command: ${streamData.command}). Stream will be orphaned on server unless explicitly killed on Pwnagotchi.`);
      // TODO: As above, implement robust remote process killing on disconnect.
      activeStreams.delete(socket.id);
    }
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
// import { executePwnagotchiCommand, getPwnagotchiApiData, parseRecentHandshakes, parseUnits, parseAIStatus } from './lib/pwnagotchiService.js'; // Already imported at the top

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
    let pwnagotchiIsConnected = false; // Flag to track if any data fetch was successful in this poll
    let overallUptime = 0;

    // 1. Fetch Handshakes
    let handshakesData;
    try {
      if (process.env.PWNAGOTCHI_API_BASE_URL) {
        // handshakesData = await getPwnagotchiApiData('/api/v1/handshakes/recent'); // Hypothetical
      }
      if (!handshakesData) {
        const handshakeResult = await executePwnagotchiCommand('pwnagotchi-cli handshakes recent');
        if (handshakeResult.code === 0 && handshakeResult.stdout) {
          handshakesData = parseRecentHandshakes(handshakeResult.stdout);
          pwnagotchiIsConnected = true; // Mark as connected if this succeeds
        } else {
          logger.warn(`Failed to fetch handshakes via CLI: ${handshakeResult.stderr || 'No output'} (Code: ${handshakeResult.code})`);
        }
      }

      if (handshakesData) {
        const newHandshakesCount = handshakesData.filter(h =>
          !lastKnownHandshakes.some(old_h => JSON.stringify(old_h) === JSON.stringify(h))
        ).length;
        if (newHandshakesCount > 0 || handshakesData.length !== lastKnownHandshakes.length) {
          pwnagotchiHandshakesTotal.inc(newHandshakesCount);
          logger.info(`Found ${handshakesData.length} handshakes (${newHandshakesCount} new). Broadcasting...`);
          io.emit('handshakes:update', handshakesData);
          lastKnownHandshakes = JSON.parse(JSON.stringify(handshakesData));
        }
      }
    } catch (e) { logger.error('Error fetching handshakes:', e.message); }

    // 2. Fetch Network Updates (Units)
    let networksData;
    try {
      if (process.env.PWNAGOTCHI_API_BASE_URL) {
        networksData = await getPwnagotchiApiData('/api/v1/units');
        if (networksData) pwnagotchiIsConnected = true;
      } else {
        const networkResult = await executePwnagotchiCommand('pwnagotchi-cli units');
        if (networkResult.code === 0 && networkResult.stdout) {
          networksData = parseUnits(networkResult.stdout);
          if (networksData) pwnagotchiIsConnected = true;
        } else {
          logger.warn(`Failed to fetch networks via CLI: ${networkResult.stderr || 'No output'} (Code: ${networkResult.code})`);
        }
      }
      if (networksData) {
        pwnagotchiNetworksDetectedTotal.set(networksData.length);
        if (JSON.stringify(networksData) !== JSON.stringify(lastKnownNetworks)) {
          logger.info(`Found ${networksData.length} networks. Broadcasting...`);
          io.emit('networks:update', networksData);
          lastKnownNetworks = JSON.parse(JSON.stringify(networksData));
        }
      }
    } catch (e) { logger.error('Error fetching networks:', e.message); }

    // 3. Fetch AI Status (which often includes uptime)
    let aiStatusData;
    try {
      if (process.env.PWNAGOTCHI_API_BASE_URL) {
        aiStatusData = await getPwnagotchiApiData('/api/v1/status-display');
        if (aiStatusData) pwnagotchiIsConnected = true;
      } else {
        const aiStatusResult = await executePwnagotchiCommand('pwnagotchi-cli status');
        if (aiStatusResult.code === 0 && aiStatusResult.stdout) {
          aiStatusData = parseAIStatus(aiStatusResult.stdout);
          if (aiStatusData) pwnagotchiIsConnected = true;
        } else {
          logger.warn(`Failed to fetch AI status via CLI: ${aiStatusResult.stderr || 'No output'} (Code: ${aiStatusResult.code})`);
        }
      }
      if (aiStatusData) {
        if (JSON.stringify(aiStatusData) !== JSON.stringify(lastKnownAIStatus)) {
          logger.info('AI status change detected. Broadcasting...', aiStatusData);
          io.emit('ai:status', aiStatusData);
          lastKnownAIStatus = aiStatusData;
        }
        // Update uptime metric if available in AI status
        // Common Pwnagotchi status output includes 'uptime' in seconds or human-readable.
        // Assuming 'uptime' is a field in seconds.
        if (typeof aiStatusData.uptime === 'number') {
          overallUptime = aiStatusData.uptime;
        } else if (typeof aiStatusData.uptime === 'string') { // Try to parse if string like "1 day, 2:30:00"
            // Basic parsing for "X day(s), HH:MM:SS" or "HH:MM:SS" - this is a simplification
            // A more robust parser would be needed for various uptime string formats.
            // For now, only direct number or simple "HH:MM:SS" or "MM:SS" or "SS"
            const parts = aiStatusData.uptime.split(',').pop().trim().split(':').map(Number);
            if (parts.length === 3) overallUptime = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2) overallUptime = parts[0] * 60 + parts[1];
            else if (parts.length === 1) overallUptime = parts[0];
        }
      }
    } catch (e) { logger.error('Error fetching AI status:', e.message); }

    // Update connection status and uptime metrics
    pwnagotchiConnectionStatus.set(pwnagotchiIsConnected ? 1 : 0);
    if (pwnagotchiIsConnected && overallUptime > 0) {
        pwnagotchiReportedUptime.set(overallUptime);
    } else if (!pwnagotchiIsConnected) {
        pwnagotchiReportedUptime.set(0); // Reset uptime if disconnected
    }

  } catch (error) { // Catch any unexpected errors from the overall polling logic
    logger.error('Critical error in Pwnagotchi polling loop:', { message: error.message, stack: error.stack });
    pwnagotchiConnectionStatus.set(0); // Assume disconnected on critical error
    pwnagotchiReportedUptime.set(0);
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
