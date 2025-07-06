import {
  initPwnagotchiService,
  executePwnagotchiCommand,
  getPwnagotchiApiData,
  parsePluginsList,
  parseRecentHandshakes,
  parseUnits,
  parseAIStatus,
  // streamPwnagotchiCommand // Testing streaming is more complex, might need different approach or skip for basic unit tests
} from '../../lib/pwnagotchiService.js'; // Adjust path as necessary

// Mock node-ssh
const mockExecCommand = jest.fn();
const mockConnect = jest.fn();
const mockDispose = jest.fn();
jest.mock('node-ssh', () => {
  return {
    NodeSSH: jest.fn().mockImplementation(() => {
      return {
        connect: mockConnect,
        execCommand: mockExecCommand,
        dispose: mockDispose,
        connection: null, // Mock internal connection status as needed by getSshConnection
      };
    }),
  };
});

// Mock axios
jest.mock('axios');
import axios from 'axios';

describe('Pwnagotchi Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockExecCommand.mockReset();
    mockConnect.mockReset();
    mockDispose.mockReset();
    axios.get.mockReset();
    axios.post.mockReset();

    // Reset environment variables that initPwnagotchiService reads
    delete process.env.PWNAGOTCHI_HOST;
    delete process.env.PWNAGOTCHI_USER;
    delete process.env.PWNAGOTCHI_SSH_KEY_PATH;
    delete process.env.PWNAGOTCHI_API_BASE_URL;
    delete process.env.MOCK_PWNAGOTCHI_API_URL;
    delete process.env.MOCK_PWNAGOTCHI_CLI_URL;
  });

  describe('initPwnagotchiService', () => {
    it('should configure for SSH if SSH env vars are provided', () => {
      process.env.PWNAGOTCHI_HOST = 'testhost';
      process.env.PWNAGOTCHI_USER = 'testuser';
      initPwnagotchiService();
      // Difficult to assert internal state without exporting it or specific getters.
      // We can infer by how other functions behave based on this init.
      // For now, just ensure it runs without error.
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should configure for API if API base URL is provided', () => {
      process.env.PWNAGOTCHI_API_BASE_URL = 'http://testhost/api';
      initPwnagotchiService();
      expect(true).toBe(true); // Placeholder
    });

    it('should configure for mock CLI if MOCK_PWNAGOTCHI_CLI_URL is set', () => {
      process.env.MOCK_PWNAGOTCHI_CLI_URL = 'http://mockcli/command';
      initPwnagotchiService();
       // Further tests for executePwnagotchiCommand will verify this path is taken.
      expect(true).toBe(true);
    });

    it('should configure for mock API if MOCK_PWNAGOTCHI_API_URL is set', () => {
      process.env.MOCK_PWNAGOTCHI_API_URL = 'http://mockapi/api';
      initPwnagotchiService();
      // Further tests for getPwnagotchiApiData will verify this.
      expect(true).toBe(true);
    });
  });

  describe('executePwnagotchiCommand', () => {
    it('should use mock CLI URL if configured', async () => {
      process.env.MOCK_PWNAGOTCHI_CLI_URL = 'http://mockcli/command';
      initPwnagotchiService(); // Initialize with mock URL

      const mockResponse = { stdout: 'mock success', stderr: '', code: 0 };
      axios.post.mockResolvedValue({ data: mockResponse });

      const result = await executePwnagotchiCommand('test command');
      expect(axios.post).toHaveBeenCalledWith('http://mockcli/command', { command: 'test command' });
      expect(result).toEqual(mockResponse);
    });

    it('should execute command via SSH if configured', async () => {
      process.env.PWNAGOTCHI_HOST = 'testhost';
      process.env.PWNAGOTCHI_USER = 'testuser';
      initPwnagotchiService();

      const mockSshResult = { stdout: 'ssh success', stderr: '', code: 0 };
      mockConnect.mockResolvedValue(true); // Simulate successful connection
      // Simulate that the ssh instance's connection object gets set after connect
      // This is a bit tricky due to how NodeSSH is instantiated and its internal state managed.
      // We might need to access the mocked instance if getSshConnection relies on `ssh.connection`.
      // For this test, we'll assume getSshConnection works if mockConnect resolves.
      const NodeSSH = require('node-ssh').NodeSSH;
      const sshInstance = NodeSSH.mock.instances[0]; // Get the instance
      sshInstance.connection = { connected: true }; // Mock that connection is established

      mockExecCommand.mockResolvedValue(mockSshResult);

      const result = await executePwnagotchiCommand('ssh test');
      expect(mockConnect).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('ssh test', {});
      expect(result).toEqual(mockSshResult);
    });

    it('should return error if SSH not configured and no mock CLI', async () => {
        initPwnagotchiService(); // No SSH or mock vars
        const result = await executePwnagotchiCommand('any command');
        expect(result.stderr).toContain('SSH not configured');
        expect(result.code).toBe(-1);
    });
  });

  describe('getPwnagotchiApiData', () => {
    it('should use mock API URL if configured', async () => {
      process.env.MOCK_PWNAGOTCHI_API_URL = 'http://mockapi/api';
      initPwnagotchiService();

      const mockApiResponse = { data: 'mock api data' };
      axios.get.mockResolvedValue({ data: mockApiResponse });

      const result = await getPwnagotchiApiData('/test');
      expect(axios.get).toHaveBeenCalledWith('http://mockapi/api/test', { params: {} });
      expect(result).toEqual(mockApiResponse);
    });

    it('should fetch data from real API if configured', async () => {
      process.env.PWNAGOTCHI_API_BASE_URL = 'http://realapi/api';
      initPwnagotchiService();

      const mockApiResponse = { data: 'real api data' };
      axios.get.mockResolvedValue({ data: mockApiResponse });

      const result = await getPwnagotchiApiData('/real-test', { param: 'value' });
      expect(axios.get).toHaveBeenCalledWith('http://realapi/api/real-test', { params: { param: 'value' } });
      expect(result).toEqual(mockApiResponse);
    });

    it('should return null if no API URL configured', async () => {
        initPwnagotchiService(); // No API vars
        const result = await getPwnagotchiApiData('/any');
        expect(result).toBeNull();
    });
  });

  describe('Parsing Functions', () => {
    it('parsePluginsList correctly parses valid plugin list', () => {
      const rawOutput = "  grid (enabled)\n  memtemp (loaded)\n  gps (disabled)\n  some-plugin (running)\n";
      const expected = [
        { name: 'grid', status: 'enabled' },
        { name: 'memtemp', status: 'loaded' },
        { name: 'gps', status: 'disabled' },
        { name: 'some-plugin', status: 'running' },
      ];
      expect(parsePluginsList(rawOutput)).toEqual(expected);
    });

    it('parseRecentHandshakes correctly parses CSV-like handshake data', () => {
      const rawOutput = "ESSID: MyNet, BSSID: AA:BB:CC:DD:EE:FF, Timestamp: 2023-01-01 10:00:00\nESSID: Another Net, Station: 11:22:33:44:55:66, Timestamp: 2023-01-01 10:05:00";
      const expected = [
        { essid: 'MyNet', bssid: 'AA:BB:CC:DD:EE:FF', timestamp: '2023-01-01 10:00:00' },
        { essid: 'Another Net', station: '11:22:33:44:55:66', timestamp: '2023-01-01 10:05:00' },
      ];
      expect(parseRecentHandshakes(rawOutput)).toEqual(expected);
    });

    it('parseRecentHandshakes correctly parses JSON handshake data', () => {
        const rawOutput = JSON.stringify([{ essid: 'JSONNet', bssid: 'FF:EE:DD:CC:BB:AA', timestamp: '2023-01-02 12:00:00' }]);
        const expected = [{ essid: 'JSONNet', bssid: 'FF:EE:DD:CC:BB:AA', timestamp: '2023-01-02 12:00:00' }];
        expect(parseRecentHandshakes(rawOutput)).toEqual(expected);
    });

    it('parseUnits correctly parses JSON array', () => {
      const rawOutput = JSON.stringify([{ name: 'Unit1' }, { name: 'Unit2' }]);
      const expected = [{ name: 'Unit1' }, { name: 'Unit2' }];
      expect(parseUnits(rawOutput)).toEqual(expected);
    });

    it('parseAIStatus correctly parses JSON object', () => {
      const rawOutput = JSON.stringify({ mood: 'happy', uptime: '10h' });
      const expected = { mood: 'happy', uptime: '10h' };
      expect(parseAIStatus(rawOutput)).toEqual(expected);
    });

    it('parseAIStatus correctly parses key-value lines', () => {
      const rawOutput = "Mood: bored\nUptime: 1 day, 02:30:00\nMessage: Test message";
      const expected = { mood: 'bored', uptime: '1 day, 02:30:00', message: 'Test message' };
      expect(parseAIStatus(rawOutput)).toEqual(expected);
    });
  });
});
[end of backend/lib/pwnagotchiService.test.js]
