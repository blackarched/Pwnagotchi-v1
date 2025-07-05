import { NodeSSH } from 'node-ssh';
import axios from 'axios';
import { createLogger, format, transports } from 'winston'; // Assuming winston is available

// Logger for this service
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [new transports.Console()],
});

const ssh = new NodeSSH();
let sshConnectionConfig = null;
let pwnagotchiApiBaseUrl = null; // For real Pwnagotchi API
let mockPwnagotchiCliUrl = null; // For mock CLI over HTTP

/**
 * Initializes the Pwnagotchi service with connection details.
 * Call this function once when the application starts.
 */
export function initPwnagotchiService() {
  const {
    PWNAGOTCHI_HOST,
    PWNAGOTCHI_PORT,
    PWNAGOTCHI_USER,
    PWNAGOTCHI_SSH_KEY_PATH,
    PWNAGOTCHI_API_BASE_URL,
    MOCK_PWNAGOTCHI_API_URL, // For testing: overrides PWNAGOTCHI_API_BASE_URL
    MOCK_PWNAGOTCHI_CLI_URL, // For testing: used by executePwnagotchiCommand to simulate CLI via HTTP
  } = process.env;

  // Configure for mock server if MOCK URLs are provided
  if (MOCK_PWNAGOTCHI_API_URL) {
    pwnagotchiApiBaseUrl = MOCK_PWNAGOTCHI_API_URL;
    logger.info(`Using MOCK Pwnagotchi API base URL: ${pwnagotchiApiBaseUrl}`);
  } else if (PWNAGOTCHI_API_BASE_URL) {
    pwnagotchiApiBaseUrl = PWNAGOTCHI_API_BASE_URL;
    logger.info(`Pwnagotchi direct API base URL configured: ${pwnagotchiApiBaseUrl}`);
  } else {
    logger.info('Pwnagotchi direct API base URL not configured. Direct API calls will be disabled.');
  }

  if (MOCK_PWNAGOTCHI_CLI_URL) {
    mockPwnagotchiCliUrl = MOCK_PWNAGOTCHI_CLI_URL;
    logger.info(`Using MOCK Pwnagotchi CLI URL for simulated commands: ${mockPwnagotchiCliUrl}`);
    // SSH config might not be needed if all commands are mocked via HTTP
    sshConnectionConfig = null; // Explicitly disable SSH if mock CLI URL is set
    logger.warn('SSH connections disabled due to MOCK_PWNAGOTCHI_CLI_URL being set.');
  } else if (PWNAGOTCHI_HOST && PWNAGOTCHI_USER) {
    sshConnectionConfig = {
      host: PWNAGOTCHI_HOST,
      port: parseInt(PWNAGOTCHI_PORT, 10) || 22,
      username: PWNAGOTCHI_USER,
    };
    if (PWNAGOTCHI_SSH_KEY_PATH) {
      sshConnectionConfig.privateKeyPath = PWNAGOTCHI_SSH_KEY_PATH;
      logger.info(`Using SSH key for real Pwnagotchi: ${PWNAGOTCHI_SSH_KEY_PATH}`);
    } else {
      logger.warn('PWNAGOTCHI_SSH_KEY_PATH not set. Real SSH connections may fail.');
    }
  } else {
    logger.warn('Real Pwnagotchi SSH host or user not configured. SSH functionalities will be disabled.');
    sshConnectionConfig = null;
  }
  logger.info('Pwnagotchi service initialized.');
}

/**
 * Ensures SSH connection is established.
 * This is a simplified example; real-world usage might need more robust connection pooling/management.
 * @returns {Promise<NodeSSH>} Connected SSH client instance
 * @throws {Error} If connection fails
 */
async function getSshConnection() {
  if (!sshConnectionConfig) {
    throw new Error('SSH connection not configured. Call initPwnagotchiService first.');
  }
  if (!ssh.connection) {
    logger.info(`Attempting to connect to Pwnagotchi via SSH: ${sshConnectionConfig.username}@${sshConnectionConfig.host}:${sshConnectionConfig.port}`);
    try {
      await ssh.connect(sshConnectionConfig);
      logger.info('SSH connection established successfully.');
    } catch (error) {
      logger.error(`SSH Connection Error: ${error.message}`, { stack: error.stack, level: error.level }); // Log level from error object if available
      throw error; // Re-throw to be caught by caller
    }
  }
  return ssh;
}

/**
 * Executes a command on the Pwnagotchi via SSH.
 * @param {string} command The command to execute.
 * @param {object} options Options for node-ssh execCommand (e.g., cwd, stdin, options for pty).
 * @returns {Promise<{stdout: string, stderr: string, code: number}>} Result of the command execution.
 */
export async function executePwnagotchiCommand(command, options = {}) {
  // If mock CLI URL is configured, use it instead of SSH
  if (mockPwnagotchiCliUrl) {
    logger.info(`Executing MOCKED command via HTTP POST to ${mockPwnagotchiCliUrl}: ${command}`);
    try {
      const response = await axios.post(mockPwnagotchiCliUrl, { command });
      // Assuming the mock server returns a structure like { stdout, stderr, code }
      return response.data;
    } catch (error) {
      logger.error(`Error executing MOCKED command '${command}' via HTTP: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      return { stdout: '', stderr: `Failed to contact mock CLI server: ${error.message}`, code: -1 };
    }
  }

  // Original SSH logic
  if (!sshConnectionConfig) {
    logger.error('Cannot execute command: SSH not configured (and no mock CLI URL provided).');
    return { stdout: '', stderr: 'SSH not configured.', code: -1 };
  }

  let sshClient;
  try {
    sshClient = await getSshConnection();
    logger.info(`Executing command on Pwnagotchi: ${command}`);
    const result = await sshClient.execCommand(command, options);
    logger.debug(`Command executed: ${command}, Code: ${result.code}, Stdout: ${result.stdout.substring(0,100)}..., Stderr: ${result.stderr.substring(0,100)}...`);
    if (result.code !== 0 && result.stderr) {
        logger.warn(`Command '${command}' exited with code ${result.code} and stderr: ${result.stderr}`);
    }
    return result;
  } catch (error) {
    logger.error(`Error executing SSH command '${command}': ${error.message}`, { stack: error.stack });
    // Attempt to close connection if it's an unrecoverable error or if policy dictates
    if (ssh.connection) {
        // ssh.dispose(); // Consider disposing only on certain types of errors
    }
    return { stdout: '', stderr: error.message, code: -1 };
  }
  // ssh.dispose(); // Dispose after each command, or manage connection pooling
}

/**
 * Fetches data from the Pwnagotchi's direct HTTP API.
 * @param {string} endpoint The API endpoint (e.g., '/plugins').
 * @param {object} params Query parameters for the request.
 * @returns {Promise<object|null>} The API response data, or null on error.
 */
export async function getPwnagotchiApiData(endpoint, params = {}) {
  if (!pwnagotchiApiBaseUrl) {
    logger.warn(`Cannot fetch API data: Pwnagotchi API base URL not configured. Endpoint: ${endpoint}`);
    return null;
  }

  const url = `${pwnagotchiApiBaseUrl}${endpoint}`;
  try {
    logger.info(`Fetching data from Pwnagotchi API: ${url}`);
    const response = await axios.get(url, { params });
    logger.debug(`Pwnagotchi API response for ${url}: Status ${response.status}`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching data from Pwnagotchi API '${url}': ${error.message}`, {
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });
    return null;
  }
}

// Example parsing function (to be expanded based on actual command outputs)
/**
 * Parses the output of `pwnagotchi-cli plugins list` command.
 * @param {string} rawOutput The raw stdout from the command.
 * @returns {Array<object>} A list of plugins with their status.
 */
export function parsePluginsList(rawOutput) {
  // Placeholder implementation - actual parsing logic depends on command output format
  // Example: "  plugin_name (enabled|disabled)\n another_plugin (enabled)\n"
  const plugins = [];
  if (!rawOutput) return plugins;

  const lines = rawOutput.trim().split('\n');
  lines.forEach(line => {
    const match = line.trim().match(/^(\S+)\s+\((enabled|disabled|loaded|not loaded)\)$/); // Adjusted for more statuses
    if (match) {
      plugins.push({ name: match[1], status: match[2] });
    } else if (line.trim()) { // to avoid empty lines causing warnings
      logger.warn(`Could not parse plugin line: "${line}"`);
    }
  });
  return plugins;
}


/**
 * Parses the output of `pwnagotchi-cli handshakes recent` command.
 * @param {string} rawOutput The raw stdout from the command.
 * @returns {Array<object>} A list of recent handshakes.
 */
export function parseRecentHandshakes(rawOutput) {
  // Placeholder implementation - actual parsing logic depends on Pwnagotchi output
  // Example format: "ESSID: MyNetwork, BSSID: AA:BB:CC:DD:EE:FF, Timestamp: YYYY-MM-DD HH:MM:SS, Path: /path/to/handshake.pcap\n"
  const handshakes = [];
   if (!rawOutput) return handshakes;

  const lines = rawOutput.trim().split('\n');
  lines.forEach(line => {
    // This is highly dependent on the actual output format of pwnagotchi-cli
    // Assuming a simple comma-separated value line for demonstration
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 3) { // Example: ESSID, BSSID, Timestamp
      handshakes.push({
        essid: parts[0].replace('ESSID: ', ''),
        bssid: parts[1].replace('BSSID: ', ''),
        timestamp: parts[2].replace('Timestamp: ', ''),
        // path: parts[3] ? parts[3].replace('Path: ', '') : undefined
      });
    } else if (line.trim()) {
        logger.warn(`Could not parse handshake line: "${line}"`);
    }
  });
  return handshakes;
}

/**
 * Parses the output of a hypothetical `pwnagotchi-cli units` command.
 * @param {string} rawOutput The raw stdout from the command.
 * @returns {Array<object>} A list of units/networks.
 */
export function parseUnits(rawOutput) {
  // Placeholder: Assume each line is a JSON object representing a unit, or needs complex parsing.
  // For simplicity, let's assume it's line-delimited JSON or easily parsable.
  const units = [];
  if (!rawOutput) return units;
  try {
    // Attempt to parse as if it's a JSON array directly
    return JSON.parse(rawOutput);
  } catch (e) {
    // Fallback to line-by-line parsing if not a direct JSON array
    const lines = rawOutput.trim().split('\n');
    lines.forEach(line => {
      try {
        units.push(JSON.parse(line)); // If each line is a self-contained JSON
      } catch (lineError) {
        logger.warn(`Could not parse unit line as JSON: "${line}"`);
        // Add non-JSON parsing logic here if needed
      }
    });
  }
  return units;
}

/**
 * Parses the output of a hypothetical `pwnagotchi-cli status` command for AI status.
 * @param {string} rawOutput The raw stdout from the command.
 * @returns {object|null} An object representing AI status (mood, message, etc.).
 */
export function parseAIStatus(rawOutput) {
  // Placeholder: Assume output is key-value pairs or simple JSON.
  // Example: "Mood: happy\nMessage: Making friends!"
  if (!rawOutput) return null;
  try {
    return JSON.parse(rawOutput); // Ideal case
  } catch (e) {
    const status = {};
    rawOutput.trim().split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        status[parts[0].trim().toLowerCase()] = parts[1].trim();
      }
    });
    return Object.keys(status).length > 0 ? status : null;
  }
}


// Call init during module load to setup variables from .env
// This should ideally be called from the main server startup after dotenv.config()
// For now, placing it here for simplicity, but it means .env must be loaded before this module.
// initPwnagotchiService();
// Better: export init and call it from server.js after dotenv.config()

// Ensure to add 'node-ssh' and 'axios' to backend/package.json dependencies.
// npm install node-ssh axios
// And 'winston' if not already there.

// SSH Connection Management Note:
// The current getSshConnection establishes a new connection if one isn't active.
// For frequent commands, this is inefficient. Consider:
// 1. A persistent connection managed and reused.
// 2. A connection pool if multiple concurrent operations are expected.
// 3. ssh.dispose() should be called when the application shuts down or when the connection is no longer needed.
//    For now, it's not called automatically after each command to allow reuse by subsequent calls within a short time.
//    A more robust strategy would involve a timer to dispose of idle connections or explicit close.

logger.info('Pwnagotchi Service module loaded. Call initPwnagotchiService() to configure.');
