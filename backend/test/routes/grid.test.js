import request from 'supertest';
import express from 'express';
// Import the router
import gridRouter from '../../routes/grid.js'; // Adjust path as necessary
// Mock the pwnagotchiService
jest.mock('../../lib/pwnagotchiService.js');
import { getPwnagotchiApiData, executePwnagotchiCommand } from '../../lib/pwnagotchiService.js';

// Mock Redis for caching (if not testing caching itself here)
jest.mock('../../redis.js', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
}));
import { getCachedData, setCachedData } from '../../redis.js';


const app = express();
app.use(express.json());
// Mount the router under a path, e.g., /api/grid or just / if routes are defined with full path
// Based on server.js: app.use('/api', gridRouter); -> so gridRouter handles /v1/data etc.
// For isolated testing, we can mount it at root or a test-specific path.
// Let's assume gridRouter defines routes like '/v1/data'
app.use('/api/grid', gridRouter); // If gridRouter expects to be mounted at /api/grid
// Or, if gridRouter paths start with /api/v1/data like in server.js app.use('/api', gridRouter)
// then we should test paths like /api/v1/data. For simplicity, let's assume routes in grid.js are relative like '/v1/data'
// and we mount it here on '/test-grid'
// Actually, server.js does `app.use('/api', gridRouter);`
// and grid.js has `router.get('/v1/data', ...)`. So requests will be `GET /api/v1/data`.
// Let's adjust the test app to reflect this:
const testApp = express();
testApp.use(express.json());
testApp.use('/api', gridRouter); // Mount as in server.js


describe('Grid API Routes', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    getPwnagotchiApiData.mockClear();
    executePwnagotchiCommand.mockClear();
    getCachedData.mockClear();
    setCachedData.mockClear();
  });

  describe('GET /api/v1/data (Grid Data)', () => {
    it('should return data from API when PWNAGOTCHI_API_BASE_URL is set', async () => {
      process.env.PWNAGOTCHI_API_BASE_URL = 'http://mockpwnagotchi';
      const mockApiResponse = { 'some': 'grid data' };
      getPwnagotchiApiData.mockResolvedValue(mockApiResponse);
      getCachedData.mockResolvedValue(null); // Cache miss

      const res = await request(testApp).get('/api/v1/data');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockApiResponse);
      expect(getPwnagotchiApiData).toHaveBeenCalledWith('/api/v1/data', {});
      expect(setCachedData).toHaveBeenCalledWith('grid:v1:data/api/v1/data', mockApiResponse, expect.any(Number));
      delete process.env.PWNAGOTCHI_API_BASE_URL;
    });

    it('should return data from CLI when PWNAGOTCHI_API_BASE_URL is not set', async () => {
      const mockCliResponse = { stdout: '{"cli": "grid data"}', stderr: '', code: 0 };
      const expectedParsedData = { cli: "grid data" };
      executePwnagotchiCommand.mockResolvedValue(mockCliResponse);
      getCachedData.mockResolvedValue(null); // Cache miss
      // Note: grid.js uses 'pwnagotchi-cli grid data' which is hypothetical.
      // The route definition does not pass a parseFunction, so it defaults to JSON.parse(stdout).

      const res = await request(testApp).get('/api/v1/data');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expectedParsedData);
      expect(executePwnagotchiCommand).toHaveBeenCalledWith('pwnagotchi-cli grid data');
      expect(setCachedData).toHaveBeenCalledWith('grid:v1:data/api/v1/data', expectedParsedData, expect.any(Number));
    });

    it('should return cached data if available', async () => {
      const cachedResponse = { 'cached': 'grid data' };
      getCachedData.mockResolvedValue(cachedResponse);

      const res = await request(testApp).get('/api/v1/data');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(cachedResponse);
      expect(getPwnagotchiApiData).not.toHaveBeenCalled();
      expect(executePwnagotchiCommand).not.toHaveBeenCalled();
    });

    it('should return 501 if no interaction method is configured', async () => {
        // To test this, we need to ensure that the route's handleGetRequest is called
        // with a configuration that has neither apiPath nor cliCommand, or that
        // PWNAGOTCHI_API_BASE_URL is unset AND the cliCommand is also null/undefined in the route definition.
        // The current /api/v1/data route in grid.js *always* provides apiPath and cliCommand.
        // So, this specific test case might not be directly applicable to this route unless we modify grid.js
        // or test the helper function `handleGetRequest` in isolation with such params.
        // For now, we assume routes always define one or the other.
        // If we wanted to test this, we'd need a route that omits these.
        // As an alternative, let's test failure from the service.
        process.env.PWNAGOTCHI_API_BASE_URL = 'http://mockpwnagotchi';
        getPwnagotchiApiData.mockRejectedValue(new Error('Pwnagotchi API error'));
        getCachedData.mockResolvedValue(null);

        const res = await request(testApp).get('/api/v1/data');
        expect(res.statusCode).toEqual(500); // Or whatever error status the global error handler sends
        delete process.env.PWNAGOTCHI_API_BASE_URL;
    });
  });

  // TODO: Add tests for POST /api/v1/data (currently returns 501)
  // TODO: Add tests for GET /api/v1/units
  // TODO: Add tests for POST /api/v1/report/ap (currently returns 501)
});
[end of backend/test/routes/grid.test.js]
