import express from 'express';
import { getPwnagotchiApiData, executePwnagotchiCommand } from '../lib/pwnagotchiService.js';
import { getCachedData, setCachedData } from '../redis.js';
import { createLogger, format, transports } from 'winston';

const router = express.Router();
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const CACHE_TTL_SECONDS = process.env.MESH_CACHE_TTL_SECONDS || 60; // Default 1 minute

// Helper function to handle data fetching and caching for GET requests
async function handleGetRequest(req, res, next, { apiPath, cliCommand, cacheKey, parseFunction }) {
  try {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(cached);
    }

    logger.debug(`Cache miss for ${cacheKey}, fetching live data.`);
    let data;
    if (process.env.PWNAGOTCHI_API_BASE_URL && apiPath) {
      data = await getPwnagotchiApiData(apiPath, req.query);
    } else if (cliCommand) {
      const result = await executePwnagotchiCommand(cliCommand);
      if (result.code === 0 && result.stdout) {
        data = parseFunction ? parseFunction(result.stdout) : JSON.parse(result.stdout); // Assuming JSON output or needs parsing
      } else {
        throw new Error(`CLI command failed or produced no output: ${result.stderr || 'No stderr'}`);
      }
    } else {
      return res.status(501).json({ error: 'Not Implemented or Not Configured for this Pwnagotchi interaction method.' });
    }

    if (data) {
      await setCachedData(cacheKey, data, CACHE_TTL_SECONDS);
      return res.json(data);
    }
    return res.status(404).json({ error: 'No data found from Pwnagotchi.' });
  } catch (error) {
    logger.error(`Error in mesh route ${req.path}: ${error.message}`, { stack: error.stack });
    next(error);
  }
}

// Refactored routes

// GET /api/mesh/status (example, specific Pwnagotchi endpoint/command needed)
// Assuming /api/mesh/:status was meant to be a dynamic status type or just /api/mesh/status
router.get('/status', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: '/api/v1/mesh/status', // Hypothetical Pwnagotchi API endpoint
    cliCommand: 'pwnagotchi-cli mesh status', // Hypothetical CLI command
    cacheKey: 'mesh:status',
    // parseFunction: parseMeshStatus // if CLI output needs parsing
  });
});

// GET /api/mesh/peers
router.get('/peers', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: '/api/v1/mesh/peers', // Hypothetical Pwnagotchi API endpoint
    cliCommand: 'pwnagotchi-cli mesh peers', // Hypothetical CLI command
    cacheKey: 'mesh:peers',
    // parseFunction: parseMeshPeers
  });
});

// GET /api/mesh/data
router.get('/data', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: '/api/v1/mesh/data', // Hypothetical Pwnagotchi API endpoint
    cliCommand: 'pwnagotchi-cli mesh data', // Hypothetical CLI command
    cacheKey: 'mesh:data',
    // parseFunction: parseMeshData
  });
});

// POST /api/mesh/data - POST requests typically modify data and might not be cacheable in the same way.
// They also might not have direct CLI equivalents if they expect a body.
// This will likely interact with Pwnagotchi's API if it supports POST for mesh data.
router.post('/data', async (req, res, next) => {
  if (!process.env.PWNAGOTCHI_API_BASE_URL) {
    logger.warn('Attempted POST /api/mesh/data without PWNAGOTCHI_API_BASE_URL configured.');
    return res.status(501).json({ error: 'Not Implemented: This action requires direct Pwnagotchi API access (POST).' });
  }
  try {
    // Assuming the Pwnagotchi API endpoint for posting mesh data is '/api/v1/mesh/data'
    // And that getPwnagotchiApiData can be adapted or a new postPwnagotchiApiData function is made.
    // For now, let's assume pwnagotchiService needs a post function.
    // This is a placeholder for actual POST logic to Pwnagotchi API.
    // const response = await postPwnagotchiApiData('/api/v1/mesh/data', req.body);
    // res.status(response.status || 200).json(response.data);

    // For now, returning 501 as POST to Pwnagotchi API is not yet fully defined in pwnagotchiService
    logger.info(`Received POST /api/mesh/data with body:`, req.body);
    return res.status(501).json({ message: 'POST to Pwnagotchi mesh data API not yet fully implemented in service.', received_body: req.body });
  } catch (error) {
    logger.error(`Error in POST /api/mesh/data: ${error.message}`, { stack: error.stack });
    next(error);
  }
});

// GET /api/mesh/memory
router.get('/memory', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: '/api/v1/mesh/memory', // Hypothetical Pwnagotchi API endpoint
    cliCommand: 'pwnagotchi-cli mesh memory', // Hypothetical CLI command
    cacheKey: 'mesh:memory',
    // parseFunction: parseMeshMemory
  });
});

// GET /api/mesh/memory/:fingerprint
router.get('/memory/:fingerprint', (req, res, next) => {
  const { fingerprint } = req.params;
  handleGetRequest(req, res, next, {
    apiPath: `/api/v1/mesh/memory/${fingerprint}`, // Hypothetical Pwnagotchi API endpoint
    cliCommand: `pwnagotchi-cli mesh memory ${fingerprint}`, // Hypothetical CLI command
    cacheKey: `mesh:memory:${fingerprint}`,
    // parseFunction: parseMeshMemoryDetail
  });
});

// Note: The CLI commands and API paths used above are HYPOTHETICAL.
// They need to be replaced with actual Pwnagotchi commands/API endpoints.
// Parsing functions (e.g., parseMeshStatus) will also need to be implemented
// in pwnagotchiService.js if CLI output is not JSON.

export default router;
