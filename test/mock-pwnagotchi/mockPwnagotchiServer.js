import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8666; // Default Pwnagotchi API port

app.use(cors());
app.use(express.json());

// --- Mock Data Store ---
let mockData = {
  statusDisplay: {
    mode: "AUTO",
    face: "(◕‿‿◕)",
    status: "Waiting for bettercap_ng to start...",
    hostname: "pwnagotchi-mock",
    uptime: "00:10:30",
    epoch: 1,
    handshakes: 2,
    networks: 5,
    peers: 1,
    last_log: "Mock server initialized."
  },
  units: [
    { mac: "AA:BB:CC:DD:EE:01", hostname: "MockNet1", rssi: -50, channel: 1, encryption: "WPA2" },
    { mac: "AA:BB:CC:DD:EE:02", hostname: "MockNet2", rssi: -65, channel: 6, encryption: "WPA2-PSK" },
    { mac: "AA:BB:CC:DD:EE:03", hostname: "OpenNetwork", rssi: -70, channel: 11, encryption: "OPEN" },
  ],
  handshakes: [
    { essid: "MockNet1", bssid: "AA:BB:CC:DD:EE:01", timestamp: new Date(Date.now() - 60000).toISOString(), path: "/path/to/mock1.pcap" },
    { essid: "MockNet2", bssid: "AA:BB:CC:DD:EE:02", timestamp: new Date(Date.now() - 120000).toISOString(), path: "/path/to/mock2.pcap" },
  ],
  // Data for other hypothetical CLI commands if needed
  cli: {
    "pwnagotchi-cli plugins list": "  plugin1 (enabled)\n  plugin2 (disabled)\n  webcfg (loaded)\n",
    "pwnagotchi-cli handshakes recent": "ESSID: MockNet1, BSSID: AA:BB:CC:DD:EE:01, Timestamp: 2023-10-27 10:00:00, Path: /path/to/mock1.pcap\nESSID: MockNet2, BSSID: AA:BB:CC:DD:EE:02, Timestamp: 2023-10-27 09:58:00, Path: /path/to/mock2.pcap",
    "pwnagotchi-cli units": JSON.stringify([
      { mac: "AA:BB:CC:DD:EE:01", hostname: "MockNet1_CLI", rssi: -55, channel: 1, encryption: "WPA2" },
      { mac: "AA:BB:CC:DD:EE:02", hostname: "MockNet2_CLI", rssi: -60, channel: 6, encryption: "WPA2-PSK" },
    ]),
    "pwnagotchi-cli status": JSON.stringify({ mood: "happy (mock)", message: "Simulating joy!"}),
    // Added mock CLI responses for mesh routes
    "pwnagotchi-cli mesh peers": JSON.stringify([
      { id: "peer1_cli", address: "10.0.0.1", last_seen: new Date().toISOString() },
      { id: "peer2_cli", address: "10.0.0.2", last_seen: new Date(Date.now() - 300000).toISOString() }
    ]),
    "pwnagotchi-cli mesh status": JSON.stringify({ enabled: true, peer_count: 2, version: "mockmesh-0.1" }),
    "pwnagotchi-cli mesh data": JSON.stringify({ some_mesh_data_key: "some_mesh_data_value_cli" }),
    "pwnagotchi-cli mesh memory": JSON.stringify({ used: "10MB", total: "100MB", "peer_mem_usage": {} }),
    // For /memory/:fingerprint, the mock server's /cli-command endpoint would need to handle dynamic commands
    // or we add specific entries like "pwnagotchi-cli mesh memory peer1_cli"
  }
};

// Also, let's add corresponding API endpoints if mesh.js prioritizes API calls
// These are HYPOTHETICAL Pwnagotchi API endpoints that mesh.js might try to call.
app.get('/api/v1/mesh/peers', (req, res) => {
  res.json([
    { id: "peer1_api", address: "10.0.0.1", last_seen: new Date().toISOString() },
    { id: "peer2_api", address: "10.0.0.2", last_seen: new Date(Date.now() - 300000).toISOString() }
  ]);
});

app.get('/api/v1/mesh/status', (req, res) => {
  res.json({ enabled: true, peer_count: 2, version: "mockmesh-api-0.1" });
});

app.get('/api/v1/mesh/data', (req, res) => {
  res.json({ some_mesh_data_key: "some_mesh_data_value_api" });
});

app.get('/api/v1/mesh/memory', (req, res) => {
  res.json({ used: "12MB", total: "100MB", "peer_mem_usage_api": {} });
});

app.get('/api/v1/mesh/memory/:fingerprint', (req, res) => {
  const { fingerprint } = req.params;
  res.json({ fingerprint, used: "2MB", total: "10MB", name: `peer_mem_${fingerprint}_api` });
});

// --- Middleware to log requests ---
app.use((req, res, next) => {
  console.log(`[MockPwnagotchi] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- API Endpoints ---

// General status/data (like backend's /api/v1/data might fetch)
app.get('/api/v1/data', (req, res) => {
  res.json(mockData.statusDisplay);
});

// Units/Networks
app.get('/api/v1/units', (req, res) => {
  res.json(mockData.units);
});

// Status Display (often used for AI face/mood)
app.get('/api/v1/status-display', (req, res) => {
  res.json(mockData.statusDisplay);
});

// Handshakes (if Pwnagotchi had an API for this)
// This is hypothetical, as handshakes are usually via CLI.
app.get('/api/v1/handshakes/recent', (req, res) => {
  res.json(mockData.handshakes);
});


// --- CLI Simulation Endpoint ---
// This endpoint allows the backend's pwnagotchiService.js (in test mode)
// to "execute" CLI commands by fetching from this HTTP endpoint instead of SSH.
app.post('/api/v1/cli-command', (req, res) => {
  const { command } = req.body;
  if (command && mockData.cli[command]) {
    // Simulate stdout. For stderr or exit codes, the mock could be more complex.
    res.json({ stdout: mockData.cli[command], stderr: "", code: 0 });
  } else {
    console.warn(`[MockPwnagotchi] Unknown CLI command: ${command}`);
    res.status(404).json({ error: "Unknown CLI command", stdout: "", stderr: `Command not found: ${command}`, code: 1 });
  }
});


// --- Dynamic updates for testing WebSockets ---
// Expose an endpoint to update mock data, which backend polling would then pick up.
app.post('/api/v1/mock/update-handshake', (req, res) => {
  const newHandshake = {
    essid: req.body.essid || `NewMockNet${mockData.handshakes.length + 1}`,
    bssid: req.body.bssid || `FF:FF:FF:FF:FF:${String(mockData.handshakes.length).padStart(2, '0')}`,
    timestamp: new Date().toISOString(),
    path: `/path/to/new_mock${mockData.handshakes.length + 1}.pcap`
  };
  mockData.handshakes.unshift(newHandshake); // Add to beginning
  mockData.statusDisplay.handshakes = mockData.handshakes.length;
  mockData.statusDisplay.last_log = `New handshake for ${newHandshake.essid}`;

  // Update CLI output for handshakes
  const cliHandshakeLine = `ESSID: ${newHandshake.essid}, BSSID: ${newHandshake.bssid}, Timestamp: ${new Date(newHandshake.timestamp).toLocaleString().replace(',', '')}, Path: ${newHandshake.path}`;
  mockData.cli["pwnagotchi-cli handshakes recent"] = `${cliHandshakeLine}\n${mockData.cli["pwnagotchi-cli handshakes recent"]}`;

  console.log(`[MockPwnagotchi] Added new handshake: ${newHandshake.essid}`);
  res.json({ message: "Handshake added", newHandshake, allHandshakes: mockData.handshakes });
});

app.post('/api/v1/mock/update-status', (req, res) => {
    const { mood, status_text, epoch_increment } = req.body;
    if (mood) mockData.statusDisplay.face = mood; // Assuming face is mood for simplicity
    if (status_text) mockData.statusDisplay.status = status_text;
    if (epoch_increment) mockData.statusDisplay.epoch += epoch_increment;
    mockData.statusDisplay.last_log = status_text || `Status updated. Mood: ${mood}`;

    // Update CLI status output
    mockData.cli["pwnagotchi-cli status"] = JSON.stringify({ mood: mockData.statusDisplay.face, message: mockData.statusDisplay.status});

    console.log(`[MockPwnagotchi] Status updated: `, req.body);
    res.json({ message: "Status updated", newStatus: mockData.statusDisplay });
});


app.listen(port, () => {
  console.log(`[MockPwnagotchi] Server listening on port ${port}`);
});
