import { createClient } from 'redis';
import { createLogger, format, transports } from 'winston'; // Assuming winston is available or add to deps

// Basic logger for Redis operations, can be integrated with the main app logger if preferred
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const redisURL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient;
let isRedisConnected = false;

try {
  redisClient = createClient({
    url: redisURL,
    socket: {
      connectTimeout: 10000, // 10 seconds
      reconnectStrategy: (retries) => Math.min(retries * 50, 10000) // Reconnect every 50ms, max 10s
    }
  });

  redisClient.on('connect', () => {
    logger.info('Connecting to Redis...');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client connected successfully and ready.');
    isRedisConnected = true;
  });

  redisClient.on('error', (err) => {
    logger.error({ msg: 'Redis Client Error', error: err.message, stack: err.stack });
    isRedisConnected = false; // Assume connection is lost or problematic
  });

  redisClient.on('end', () => {
    logger.info('Redis connection closed.');
    isRedisConnected = false;
  });

  // Initiate connection
  // Starting Redis 7, connect() returns a promise.
  redisClient.connect().catch(err => {
    logger.error({ msg: 'Failed to connect to Redis during initial setup', error: err.message, stack: err.stack });
    // Depending on application requirements, you might want to exit or handle this state
  });

} catch (error) {
  logger.error({ msg: 'Failed to create Redis client instance', error: error.message, stack: error.stack });
  // Application might not be ableto function without Redis, handle appropriately
}


/**
 * Retrieves cached data from Redis.
 * @param {string} key The key to retrieve.
 * @returns {Promise<object|null>} The parsed JSON data, or null if not found or error.
 */
async function getCachedData(key) {
  if (!isRedisConnected || !redisClient) {
    logger.warn({ msg: 'Redis not connected, cannot get cache', key });
    return null;
  }
  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.debug({ msg: 'Cache hit', key });
      return JSON.parse(data);
    }
    logger.debug({ msg: 'Cache miss', key });
    return null;
  } catch (err) {
    logger.error({ msg: 'Error getting data from Redis', key, error: err.message, stack: err.stack });
    return null;
  }
}

/**
 * Stores data in Redis with a TTL.
 * @param {string} key The key to store data under.
 * @param {object} data The JSON data to store.
 * @param {number} ttlSeconds Time-to-live in seconds.
 * @returns {Promise<void>}
 */
async function setCachedData(key, data, ttlSeconds) {
  if (!isRedisConnected || !redisClient) {
    logger.warn({ msg: 'Redis not connected, cannot set cache', key });
    return;
  }
  try {
    const jsonData = JSON.stringify(data);
    await redisClient.setEx(key, ttlSeconds, jsonData);
    logger.debug({ msg: 'Cache set', key, ttl: ttlSeconds });
  } catch (err) {
    logger.error({ msg: 'Error setting data in Redis', key, error: err.message, stack: err.stack });
  }
}

export { redisClient, getCachedData, setCachedData, isRedisConnected };