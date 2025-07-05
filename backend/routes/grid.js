import express from 'express';
import { getPwnagotchiApiData, executePwnagotchiCommand } from '../lib/pwnagotchiService.js'; // Assuming pwnagotchiService.js is in ../lib
import { getCachedData, setCachedData } from '../redis.js'; // Assuming redis.js is in the parent directory
import { createLogger, format, transports } from 'winston';

const router = express.Router();
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const CACHE_TTL_SECONDS = process.env.GRID_CACHE_TTL_SECONDS || 60; // Default 1 minute

// Helper function to handle data fetching and caching for GET requests (can be shared if moved to a common lib)
async function handleGetRequest(req, res, next, { apiPath, cliCommand, cacheKey, parseFunction }) {
  try {
    const fullCacheKey = `${cacheKey}${req.originalUrl}`; // Include query params in cache key for GET
    const cached = await getCachedData(fullCacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${fullCacheKey}`);
      return res.json(cached);
    }

    logger.debug(`Cache miss for ${fullCacheKey}, fetching live data.`);
    let data;
    // Prioritize direct API call if PWNAGOTCHI_API_BASE_URL is set and apiPath is provided
    if (process.env.PWNAGOTCHI_API_BASE_URL && apiPath) {
      data = await getPwnagotchiApiData(apiPath, req.query); // req.query for query parameters
    } else if (cliCommand) {
      // Note: CLI commands might not easily accept dynamic query parameters like API calls.
      // This part might need adjustment based on how CLI commands handle parameters.
      const result = await executePwnagotchiCommand(cliCommand); // CLI command might need to incorporate req.params or req.query if applicable
      if (result.code === 0 && result.stdout) {
        data = parseFunction ? parseFunction(result.stdout) : JSON.parse(result.stdout);
      } else {
        throw new Error(`CLI command ${cliCommand} failed or produced no output: ${result.stderr || 'No stderr'}`);
      }
    } else {
      return res.status(501).json({ error: 'Not Implemented or Not Configured for this Pwnagotchi interaction method.' });
    }

    if (data) {
      await setCachedData(fullCacheKey, data, CACHE_TTL_SECONDS);
      return res.json(data);
    }
    return res.status(404).json({ error: 'No data found from Pwnagotchi.' });
  } catch (error) {
    logger.error(`Error in grid route ${req.path}: ${error.message}`, { stack: error.stack });
    next(error);
  }
}

// GET /api/v1/data
router.get('/v1/data', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: '/api/v1/data', // Actual Pwnagotchi API path
    cliCommand: 'pwnagotchi-cli grid data', // Hypothetical CLI command
    cacheKey: 'grid:v1:data',
    // parseFunction: parseGridData // if CLI output needs parsing
  });
});

// POST /api/v1/data
router.post('/v1/data', async (req, res, next) => {
  if (!process.env.PWNAGOTCHI_API_BASE_URL) {
    logger.warn('Attempted POST /api/v1/data without PWNAGOTCHI_API_BASE_URL configured.');
    return res.status(501).json({ error: 'Not Implemented: This action requires direct Pwnagotchi API access (POST).' });
  }
  try {
    // This assumes pwnagotchiService.js will have a function like postPwnagotchiApiData
    // const response = await postPwnagotchiApiData('/api/v1/data', req.body);
    // return res.status(response.status || 200).json(response.data);
    logger.info(`Received POST /api/v1/data with body:`, req.body);
    return res.status(501).json({ message: 'POST to Pwnagotchi /api/v1/data not yet fully implemented in service.', received_body: req.body });
  } catch (error) {
    logger.error(`Error in POST /api/v1/data: ${error.message}`, { stack: error.stack });
    next(error);
  }
});

// GET /api/v1/units
router.get('/v1/units', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: '/api/v1/units', // Actual Pwnagotchi API path, req.query will be passed by handleGetRequest
    cliCommand: 'pwnagotchi-cli grid units', // Hypothetical CLI command, query param handling needs thought
    cacheKey: 'grid:v1:units', // Cache key will be made unique by full URL in helper
    // parseFunction: parseGridUnits
  });
});

// POST /api/v1/report/ap
router.post('/v1/report/ap', async (req, res, next) => {
  if (!process.env.PWNAGOTCHI_API_BASE_URL) {
    logger.warn('Attempted POST /api/v1/report/ap without PWNAGOTCHI_API_BASE_URL configured.');
    return res.status(501).json({ error: 'Not Implemented: This action requires direct Pwnagotchi API access (POST).' });
  }
  try {
    // const response = await postPwnagotchiApiData('/api/v1/report/ap', req.body);
    // return res.status(response.status || 200).json(response.data);
    logger.info(`Received POST /api/v1/report/ap with body:`, req.body);
    return res.status(501).json({ message: 'POST to Pwnagotchi /api/v1/report/ap not yet fully implemented in service.', received_body: req.body });
  } catch (error) {
    logger.error(`Error in POST /api/v1/report/ap: ${error.message}`, { stack: error.stack });
    next(error);
  }
});

// Note: CLI commands are hypothetical. Parsing functions will be needed if CLI output isn't JSON.
// The handleGetRequest helper has been slightly modified to include req.originalUrl in cacheKey for GET requests
// to ensure query parameters create unique cache entries.

export default router;
