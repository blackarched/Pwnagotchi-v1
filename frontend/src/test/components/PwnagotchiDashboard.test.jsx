import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PwnagotchiDashboard from '../../components/PwnagotchiDashboard'; // Adjust path as needed

// Mock hooks and child components to isolate PwnagotchiDashboard
jest.mock('@/hooks/usePwnagotchi', () => ({
  usePwnagotchi: () => ({
    pwnagotchiState: { status: 'idle', mode: 'auto', handshakes: 0, networks: 0, peers: 0, epoch: 0, uptime: 0, last_log: 'Initializing...' },
    networks: [],
    handshakes: [],
    systemLogs: ['Log line 1', 'Log line 2'],
    plugins: [],
    config: {},
    sendCommandViaHttp: jest.fn(),
    sendCommandViaWebSocket: jest.fn(),
    updatePlugin: jest.fn(),
    saveConfig: jest.fn(),
    startDeauthAttack: jest.fn(),
    isConnected: true,
    handshakeHistory: [{ time: '10:00:00', count: 1 }, { time: '10:01:00', count: 2 }],
    startLogStream: jest.fn(),
    stopLogStream: jest.fn(),
    clearSystemLogs: jest.fn(),
  }),
}));

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark', // or 'light'
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock child components to avoid rendering their complex logic
jest.mock('@/components/NetworkMap', () => () => <div data-testid="network-map-mock">NetworkMap</div>);
jest.mock('@/components/SystemMetrics', () => () => <div data-testid="system-metrics-mock">SystemMetrics</div>);
jest.mock('@/components/HandshakeCapture', () => () => <div data-testid="handshake-capture-mock">HandshakeCapture</div>);
jest.mock('@/components/PluginManager', () => () => <div data-testid="plugin-manager-mock">PluginManager</div>);
jest.mock('@/components/config/ConfigPanel', () => () => <div data-testid="config-panel-mock">ConfigPanel</div>);
jest.mock('@/components/TerminalInterface', () => ({logs, onSendCommand}) => (
    <div data-testid="terminal-interface-mock">
        Logs: {logs.join(', ')}
        <button onClick={() => onSendCommand({command: 'test term cmd'})}>Send</button>
    </div>
));
jest.mock('@/components/PwnagotchiFace', () => () => <div data-testid="pwnagotchi-face-mock">PwnagotchiFace</div>);
jest.mock('@/components/HandshakeChart', () => () => <div data-testid="handshake-chart-mock">HandshakeChart</div>);
jest.mock('@/components/AdvancedTools', () => () => <div data-testid="advanced-tools-mock">AdvancedTools</div>);


describe('<PwnagotchiDashboard />', () => {
  it('renders the dashboard header and overview tab by default', () => {
    render(<PwnagotchiDashboard />);

    expect(screen.getByText(/PWNAGOTCHI/i)).toBeInTheDocument();
    expect(screen.getByText(/CYBER WARFARE INTERFACE v3.0/i)).toBeInTheDocument();

    // Check if overview related elements are present (e.g., PwnagotchiFace mock)
    expect(screen.getByTestId('pwnagotchi-face-mock')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM STATUS')).toBeInTheDocument(); // Part of overview
  });

  it('switches tabs when a tab button is clicked', () => {
    render(<PwnagotchiDashboard />);

    // Initial tab is overview
    expect(screen.getByTestId('pwnagotchi-face-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('network-map-mock')).not.toBeInTheDocument();

    // Click on Network Map tab
    const networkTabButton = screen.getByRole('button', { name: /NETWORK MAP/i });
    fireEvent.click(networkTabButton);

    expect(screen.getByTestId('network-map-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('pwnagotchi-face-mock')).not.toBeInTheDocument();
  });

  it('calls startLogStream when terminal tab is activated', () => {
    const mockPwnagotchiHook = require('@/hooks/usePwnagotchi').usePwnagotchi();
    render(<PwnagotchiDashboard />);

    const terminalTabButton = screen.getByRole('button', { name: /TERMINAL/i });
    fireEvent.click(terminalTabButton);

    expect(mockPwnagotchiHook.startLogStream).toHaveBeenCalled();
  });

  it('displays system logs in the overview tab', () => {
    render(<PwnagotchiDashboard />);
    // Ensure the overview tab is active by default or click it
    // This test assumes systemLogs are part of the overview section
    // Based on the JSX, system logs are shown in a panel in the overview
    expect(screen.getByText(/Log line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Log line 2/)).toBeInTheDocument();
  });

  it('calls sendCommandViaHttp when mode change button is clicked', () => {
    const mockPwnagotchiHook = require('@/hooks/usePwnagotchi').usePwnagotchi();
    render(<PwnagotchiDashboard />);

    // Assuming 'auto' mode button exists and is clicked
    const autoModeButton = screen.getByRole('button', { name: /AUTO/i });
    fireEvent.click(autoModeButton);

    expect(mockPwnagotchiHook.sendCommandViaHttp).toHaveBeenCalledWith('mode auto');
  });

  // TODO: Add more tests for:
  // - Correct data being passed to child components (e.g., HandshakeChart, PluginManager).
  // - Interaction with TerminalInterface (sending commands).
  // - Theme toggling.
  // - Other button clicks and actions (status toggle, etc.).
});
[end of frontend/src/test/components/PwnagotchiDashboard.test.jsx]
