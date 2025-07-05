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

const CACHE_TTL_SECONDS = process.env.PWNMAIL_CACHE_TTL_SECONDS || 30; // Shorter TTL for inbox data might be desired

// Helper function to handle data fetching and caching for GET requests
async function handleGetRequest(req, res, next, { apiPath, cliCommand, cacheKey, parseFunction, isDynamic = false }) {
  try {
    // For dynamic paths, ensure the cache key incorporates the dynamic parts from req.params
    let effectiveCacheKey = cacheKey;
    if (isDynamic) {
      // Example: if cacheKey is 'pwnmail:inbox:item', and req.params are {id: '123'} -> 'pwnmail:inbox:item:123'
      // This ensures that different items or marked states get different cache entries.
      effectiveCacheKey = `${cacheKey}:${Object.values(req.params).join(':')}`;
    } else {
      effectiveCacheKey = `${cacheKey}${req.originalUrl}`; // For non-dynamic, use full URL for query params
    }

    const cached = await getCachedData(effectiveCacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${effectiveCacheKey}`);
      return res.json(cached);
    }

    logger.debug(`Cache miss for ${effectiveCacheKey}, fetching live data.`);
    let data;
    if (process.env.PWNAGOTCHI_API_BASE_URL && apiPath) {
      // Construct the actual API path using req.params if needed for dynamic segments
      const resolvedApiPath = apiPath.replace(/:([a-zA-Z]+)/g, (match, paramName) => req.params[paramName]);
      data = await getPwnagotchiApiData(resolvedApiPath, req.query);
    } else if (cliCommand) {
      // Resolve CLI command if it needs params
      const resolvedCliCommand = cliCommand.replace(/:([a-zA-Z]+)/g, (match, paramName) => req.params[paramName]);
      const result = await executePwnagotchiCommand(resolvedCliCommand);
      if (result.code === 0 && result.stdout) {
        data = parseFunction ? parseFunction(result.stdout) : JSON.parse(result.stdout);
      } else {
        throw new Error(`CLI command ${resolvedCliCommand} failed: ${result.stderr || 'No stderr'}`);
      }
    } else {
      return res.status(501).json({ error: 'Not Implemented or Not Configured for this Pwnagotchi interaction method.' });
    }

    if (data) {
      // For GET requests that might modify state on the Pwnagotchi (like 'mark'),
      // consider not caching or using a very short TTL, or invalidating related caches.
      // For simplicity here, all GETs are cached.
      await setCachedData(effectiveCacheKey, data, CACHE_TTL_SECONDS);
      return res.json(data);
    }
    return res.status(404).json({ error: 'No data found from Pwnagotchi.' });
  } catch (error) {
    logger.error(`Error in pwnmail route ${req.path}: ${error.message}`, { stack: error.stack });
    next(error);
  }
}


// GET /api/v1/inbox
router.get('/v1/inbox', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: '/api/v1/inbox',
    cliCommand: 'pwnagotchi-cli pwnmail inbox', // Hypothetical
    cacheKey: 'pwnmail:inbox',
    // parseFunction: parseInboxList
  });
});

// GET /api/v1/inbox/:id
router.get('/v1/inbox/:id', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: `/api/v1/inbox/${req.params.id}`, // Path constructed dynamically
    cliCommand: `pwnagotchi-cli pwnmail show ${req.params.id}`, // Hypothetical
    cacheKey: `pwnmail:inbox:item`, // Base cache key, full key includes :id in helper
    isDynamic: true,
    // parseFunction: parseInboxItem
  });
});

// GET /api/v1/inbox/:id/:mark (e.g., mark as read/unread)
// This GET request might modify state on the Pwnagotchi.
// Caching strategy should be considered carefully (e.g., no cache or very short TTL, or cache invalidation).
router.get('/v1/inbox/:id/:mark', (req, res, next) => {
  handleGetRequest(req, res, next, {
    apiPath: `/api/v1/inbox/${req.params.id}/${req.params.mark}`,
    cliCommand: `pwnagotchi-cli pwnmail mark ${req.params.id} ${req.params.mark}`, // Hypothetical
    cacheKey: `pwnmail:inbox:item:mark`, // Base cache key
    isDynamic: true, // To include :id and :mark in cache key
    // parseFunction: parseMarkResponse
    // For state-changing GETs, consider not caching or using a very short TTL.
    // Or, after this call, invalidate 'pwnmail:inbox' and `pwnmail:inbox:item:${req.params.id}`
  });
});

// POST /api/v1/unit/:fingerprint/inbox
router.post('/v1/unit/:fingerprint/inbox', async (req, res, next) => {
  const { fingerprint } = req.params;
  if (!process.env.PWNAGOTCHI_API_BASE_URL) {
    logger.warn(`Attempted POST /api/v1/unit/${fingerprint}/inbox without PWNAGOTCHI_API_BASE_URL configured.`);
    return res.status(501).json({ error: 'Not Implemented: This action requires direct Pwnagotchi API access (POST).' });
  }
  try {
    // const response = await postPwnagotchiApiData(`/api/v1/unit/${fingerprint}/inbox`, req.body);
    // return res.status(response.status || 200).json(response.data);
    logger.info(`Received POST /api/v1/unit/${fingerprint}/inbox with body:`, req.body);
    return res.status(501).json({ message: `POST to Pwnagotchi /api/v1/unit/${fingerprint}/inbox not yet fully implemented.`, received_body: req.body });
  } catch (error) {
    logger.error(`Error in POST /api/v1/unit/${fingerprint}/inbox: ${error.message}`, { stack: error.stack });
    next(error);
  }
});

// Note: CLI commands and API paths are based on the original proxy but may need verification.
// Parsing functions will be crucial if CLI is used and output isn't JSON.

export default router;
