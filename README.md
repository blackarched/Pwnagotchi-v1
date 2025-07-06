# 🧠 Pwnagotchi Dashboard

A full-stack dashboard interface for Pwnagotchi devices, providing live telemetry, API interaction, WebSocket-based real-time updates, and mesh messaging support. This dashboard aims to be a production-ready tool for monitoring and interacting with your Pwnagotchi.

## 📐 Architecture

The dashboard consists of a React/Vite frontend, a Node.js/Express backend, and Redis for caching. The backend communicates with the Pwnagotchi device primarily via its exposed API or through SSH for CLI commands.

```
        ┌───────────────────────────┐      ┌───────────────────┐
        │        User Browser       │      │  Pwnagotchi Device│
        │  (React UI / Vite Dev)    │◀─────▶│  (SSH / HTTP API) │
        └───────────┬───────────────┘      └─────────▲─────────┘
                    │ HTTP/S (API Calls)             │
                    │ WebSocket (Live Data)          │
                    ▼                                │
        ┌───────────────────────────┐      ┌─────────┴─────────┐
        │     Frontend Server       │      │      Backend      │
        │  (Nginx in Docker)        │◀─────▶│ (Node.js/Express) │
        └───────────────────────────┘      └─────────┬─────────┘
                                                     │
                                           ┌─────────▼─────────┐
                                           │       Redis       │
                                           │     (Caching)     │
                                           └───────────────────┘
```

The backend serves as an intermediary, providing:
- API endpoints that translate to Pwnagotchi API calls or CLI commands.
- A WebSocket server that broadcasts Pwnagotchi events and log streams to connected frontend clients.
- Caching for Pwnagotchi data to reduce load on the device.
- Prometheus metrics for monitoring.

## ✅ Prerequisites

- **Node.js**: Version 18.x or later (as per `backend/Dockerfile` and `frontend/Dockerfile.frontend`). Check `.nvmrc` if present for specific version.
- **npm**: For managing dependencies.
- **Docker & Docker Compose**: For containerized deployment and local development ease.
- **Pwnagotchi Device**: A configured Pwnagotchi device accessible via SSH and/or its HTTP API from where the backend runs.
- **SSH Access**: If using SSH for CLI commands, the backend server needs network access and valid SSH credentials (preferably key-based) for the Pwnagotchi.
- **(Optional) Git**: For version control.
- **(Optional) `npx playwright install --with-deps`**: If running E2E tests locally, for browser binaries.

## ⚙️ Setup & Configuration

1.  **Clone the Repository (if applicable)**:
    ```bash
    git clone <repository-url>
    cd pwnagotchi-dashboard
    ```

2.  **Create Environment File**:
    Copy the example environment file and customize it with your settings:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file with your specific Pwnagotchi connection details, API URLs, ports, etc. Refer to the "Environment Variables" section below for details on each variable.

3.  **Install Dependencies**:
    *   **Root (for E2E tests, if running locally)**:
        ```bash
        npm install
        # To install Playwright browsers for E2E tests:
        # npx playwright install --with-deps
        ```
    *   **Backend**:
        ```bash
        cd backend
        npm install
        cd ..
        ```
    *   **Frontend**:
        ```bash
        cd frontend
        npm install
        cd ..
        ```
    *   **Note on `express-rate-limit`**: The `backend/middleware/rateLimiter.js` file was intended to be updated with more comprehensive code. If it wasn't automatically updated by the AI, please ensure the version from the AI's prompt history is used, then run `cd backend && npm install` again if `express-rate-limit` was not properly added to `package.json`.

## 🚀 Running the Application

### Local Development (Frontend & Backend Separately)

This mode is useful for active development and debugging.

1.  **Ensure `.env` is configured.**
2.  **Start Redis (if not already running globally)**:
    You can use Docker for a quick Redis instance:
    ```bash
    docker run -d -p 6379:6379 --name local-pwnagotchi-redis redis:7-alpine
    ```
    (Ensure `REDIS_URL` in your `.env` points to `redis://localhost:6379` or as appropriate).
3.  **Start the Backend Server**:
    ```bash
    cd backend
    npm start
    ```
    The backend will typically run on `http://localhost:3001` (or as per `BACKEND_PORT` in `.env`).

4.  **Start the Frontend Development Server**:
    In a new terminal:
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will typically be accessible at `http://localhost:5173` (Vite's default).

### Docker Compose (Recommended for full local environment)

This method spins up all services (frontend, backend, Redis, and optionally Prometheus) as defined in `docker-compose.yml`.

1.  **Ensure `.env` is configured.** (Docker Compose will use this file by default).
2.  **Build and Run**:
    ```bash
    docker-compose up --build -d
    ```
    *   `-d` runs containers in detached mode.
    *   View logs: `docker-compose logs -f` or `docker-compose logs -f <service_name>` (e.g., `backend`).
3.  **Accessing Services**:
    *   **Frontend Dashboard**: `http://localhost:8080` (or as per `FRONTEND_PORT` in `.env`).
    *   **Backend API**: `http://localhost:3001` (or as per `BACKEND_PORT` in `.env`).
    *   **Prometheus**: `http://localhost:9090` (or as per `PROMETHEUS_PORT` in `.env`).
4.  **Stopping Services**:
    ```bash
    docker-compose down
    ```

## 🧪 Running Tests

### Backend Unit Tests (Jest)

Includes coverage report and threshold enforcement.
```bash
cd backend
npm test
```

### Frontend Unit Tests (Vitest)

Includes coverage report and threshold enforcement.
```bash
cd frontend
npm test
# or for coverage explicitly
npm run coverage
```

### End-to-End Tests (Playwright)

These tests run against a live (potentially Dockerized) instance of the application.
Ensure the application is running (e.g., via `docker-compose up`) and accessible at the `baseURL` specified in `playwright.config.js` (default `http://localhost:8080`).

1.  **Install Playwright browsers (if not done before)**:
    ```bash
    npx playwright install --with-deps
    ```
2.  **Run E2E tests**:
    From the project root:
    ```bash
    npm run test:e2e
    ```
3.  **View E2E test report**:
    ```bash
    npm run test:e2e:report
    ```

## 🛠 Building for Production

### Docker Images

The CI/CD pipeline handles building and pushing production Docker images. To build locally:

1.  **Backend Image**:
    ```bash
    docker build -t yourusername/pwnagotchi-backend:latest -f backend/Dockerfile ./backend
    ```
2.  **Frontend Image**:
    (Ensure any necessary `VITE_` build arguments are passed if not using defaults)
    ```bash
    docker build -t yourusername/pwnagotchi-frontend:latest \
      --build-arg VITE_API_URL="/api" \
      --build-arg VITE_WEBSOCKET_PATH="/socket.io" \
      -f frontend/Dockerfile.frontend ./frontend
    ```

## 🚢 Deployment

### Docker Compose
The `docker-compose.yml` can be used for single-server deployments. Ensure your `.env` file is configured for production (e.g., correct `CORS_ORIGIN`, production Pwnagotchi details).

### Kubernetes
A sample Kubernetes manifest is provided in `backend/k8s-deployment.yaml`.
1.  **Prerequisites**:
    *   A running Kubernetes cluster.
    *   `kubectl` configured to connect to your cluster.
    *   A Docker image registry where your images are pushed (e.g., Docker Hub, GHCR, ECR).
    *   An SSH key secret for Pwnagotchi access created in your cluster (e.g., `pwnagotchi-ssh-key`).
2.  **Configuration**:
    *   Update `backend/k8s-deployment.yaml`:
        *   Replace placeholder image names (`yourregistry/...`) with your actual image paths and tags.
        *   Adjust ConfigMap values, especially Pwnagotchi connection details and `CORS_ORIGIN`.
        *   Configure Ingress if you need external access with a hostname.
3.  **Deployment**:
    ```bash
    kubectl apply -f backend/k8s-deployment.yaml
    ```
    (Or use Kustomize/Helm for more advanced deployment management).

## 🌐 Environment Variables

Refer to `.env.example` for a comprehensive list of environment variables and their descriptions. Key variables include:

**Backend (`.env` used by `backend/server.js` and `docker-compose.yml`):**
*   `PWNAGOTCHI_HOST`, `PWNAGOTCHI_PORT`, `PWNAGOTCHI_USER`, `PWNAGOTCHI_SSH_KEY_PATH`: For SSH connection to Pwnagotchi.
*   `PWNAGOTCHI_API_BASE_URL`: Optional, if Pwnagotchi has a direct HTTP API.
*   `REDIS_URL`: Connection URL for Redis.
*   `BACKEND_PORT`: Port the backend server listens on.
*   `CORS_ORIGIN`: Allowed frontend URL(s).
*   `LOG_LEVEL`: Backend logging level.
*   `WEBSOCKET_PATH`: Path for Socket.IO connections.
*   `ENABLE_METRICS`: Enable Prometheus metrics endpoint.
*   `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`: For API rate limiting.
*   `PWNAGOTCHI_POLL_INTERVAL_MS`, `ENABLE_PWNAGOTCHI_POLLING`: For backend polling of Pwnagotchi.

**Frontend (Build-time, typically set in `frontend/.env` or via Docker build args):**
*   `VITE_API_URL`: Base URL for API calls from frontend.
*   `VITE_WS_URL`: WebSocket URL for frontend connection (often derived client-side or can be absolute).
*   `VITE_WEBSOCKET_PATH`: WebSocket path for frontend (must match backend's `WEBSOCKET_PATH`).

**Docker Compose Ports (`.env` can override defaults):**
*   `FRONTEND_PORT`: Host port mapped to the frontend Nginx container's port 80.
*   `PROMETHEUS_PORT`: Host port mapped to Prometheus container's port 9090.

## 🔌 Pwnagotchi Dependencies & Interaction

This dashboard interacts with a Pwnagotchi device. Ensure your Pwnagotchi:
- Is network accessible from where the dashboard backend is running.
- Has SSH enabled and configured for key-based authentication (recommended) if using CLI commands. The public key corresponding to the private key path in `.env` must be in the Pwnagotchi's `authorized_keys`.
- (Optional) Exposes an HTTP API if `PWNAGOTCHI_API_BASE_URL` is used.
- Has known CLI commands for features you want to use (e.g., `pwnagotchi-cli status`, `pwnagotchi-cli handshakes recent`, `pwnagotchi-cli units`, `pwnagotchi-cli plugins list`). The dashboard's backend service (`pwnagotchiService.js`) and routes (`backend/routes/*.js`) use these commands. **Verify and update these commands in the backend code if they differ for your Pwnagotchi setup or version.**
- The main log file path used for streaming is assumed to be `/var/log/pwnagotchi.log` but can be changed via client request.

## 🛠 Troubleshooting

- **Connection Issues**:
    - Verify Pwnagotchi IP/hostname and SSH credentials in `.env`.
    - Check network connectivity (ping, firewall) between backend server and Pwnagotchi.
    - If using API, ensure Pwnagotchi's web service is running and accessible.
- **Frontend Shows No Data**:
    - Check browser console for WebSocket connection errors or API call failures.
    - Verify `VITE_API_URL` and WebSocket settings on the frontend match the backend/Nginx proxy.
    - Check backend logs for errors connecting to Pwnagotchi or parsing data.
- **Rate Limiting**: If you see "Too many requests", you might be hitting the API rate limits. Adjust in `.env` or `backend/middleware/rateLimiter.js` if needed for development.

## 📊 Monitoring

- **Logs**: Backend uses Winston for structured JSON logging to stdout. In Docker, these can be collected via log drivers.
- **Prometheus**: If `ENABLE_METRICS=true`, the backend exposes a `/metrics` endpoint. A Prometheus instance (included in `docker-compose.yml`) can scrape these metrics. Access Prometheus UI at `http://localhost:9090` (or your `PROMETHEUS_PORT`).

## 🚀 CI/CD Pipeline

A GitHub Actions workflow is defined in `.github/workflows/ci.yml`. It includes:
1.  Linting (ESLint).
2.  Unit tests with coverage checks for frontend and backend.
3.  Docker image builds for frontend and backend.
4.  Trivy vulnerability scans on built images.
5.  (On push to `main`) Placeholder steps for pushing images to a Docker registry and deploying to Kubernetes.
    *   Requires configuring secrets in GitHub repository (Docker credentials, K8s kubeconfig, etc.).

---

*This README provides a general guide. Specific Pwnagotchi commands and API endpoints might vary based on your Pwnagotchi version and custom plugins. Please review and adapt backend service calls (`pwnagotchiService.js` and route files) as needed.*

---

## 📋 Production Readiness Checklist

This checklist helps ensure the Pwnagotchi Dashboard is ready for a production-like environment.

**I. Configuration & Security:**
- [ ] `.env` file is properly configured with production values (strong secrets, correct hostnames, Pwnagotchi credentials).
- [ ] SSH key for Pwnagotchi access (`PWNAGOTCHI_SSH_KEY_PATH`) is secure and has minimal necessary permissions.
- [ ] `CORS_ORIGIN` is set to the specific frontend domain(s), not `*`.
- [ ] Rate limiting (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`) is configured to appropriate production levels.
- [ ] If HTTPS is used for the frontend (recommended), SSL certificates are valid, auto-renewing (e.g., via Let's Encrypt), and Nginx SSL configuration is hardened.
- [ ] All default credentials or placeholder secrets have been changed.

**II. Backend & Pwnagotchi Integration:**
- [ ] Pwnagotchi device is reachable by the backend server (network, SSH, API).
- [ ] CLI commands used in `backend/lib/pwnagotchiService.js` and `backend/routes/*.js` are verified against the target Pwnagotchi version and are not hypothetical.
- [ ] Parsing functions in `backend/lib/pwnagotchiService.js` (e.g., `parseRecentHandshakes`, `parseUnits`, `parseAIStatus`) accurately process the actual output from the Pwnagotchi.
- [ ] POST request handlers in backend routes (e.g., for actions, config changes) are fully implemented and tested if such functionality is required.
- [ ] WebSocket communication (`server.js`) for `handshakes:update`, `networks:update`, `ai:status`, and `pwnagotchi:log` correctly reflects live Pwnagotchi data and events.
- [ ] Log streaming (`pwnagotchi:log`) is functional and handles different log file paths if configured. The mechanism for stopping remote `tail -f` processes is verified or its limitations understood.

**III. Frontend & UI:**
- [ ] Frontend connects successfully to the backend API and WebSocket endpoints.
- [ ] All data displays (handshakes, networks, AI status, logs) are populated with live data, not placeholders.
- [ ] UI elements for triggering actions (mode changes, plugin toggles, etc.) correctly interact with the backend.
- [ ] Dark mode toggle works correctly and themes are applied consistently.
- [ ] Application is responsive across common device breakpoints (desktop, tablet, mobile).
- [ ] Color contrast for text and UI elements meets WCAG 2.1 AA requirements in both light and dark modes.
- [ ] Keyboard navigation is fully functional for all interactive elements.
- [ ] Necessary `aria-labels` are provided for icon-only buttons or ambiguous controls.

**IV. Monitoring & Logging:**
- [ ] Backend logging (`LOG_LEVEL`) is set appropriately for production (e.g., `info` or `warn`).
- [ ] Prometheus `/metrics` endpoint (`ENABLE_METRICS=true`) is active and returns valid counters/gauges (e.g., `pwnagotchi_handshakes_total`, `pwnagotchi_connection_status`).
- [ ] Prometheus instance is successfully scraping the backend `/metrics` endpoint.
- [ ] (Optional) Alerting rules for key metrics (e.g., Pwnagotchi disconnection) are configured if using Prometheus Alertmanager.

**V. Deployment & CI/CD:**
- [ ] Docker images for frontend and backend build successfully without errors.
- [ ] Docker images pass Trivy vulnerability scan with zero CRITICAL/HIGH alerts (or accepted vulnerabilities are documented).
- [ ] `docker-compose.yml` is configured correctly for production-like deployment (ports, volumes, env vars).
- [ ] Kubernetes manifests (`backend/k8s-deployment.yaml`) are validated and configured for the target cluster (image names, ConfigMap values, secrets, ingress).
- [ ] CI/CD pipeline (e.g., GitHub Actions) successfully completes all stages: lint, test (unit & E2E if fully enabled), build, scan.
- [ ] (If applicable) Automated deployment steps in CI/CD push to the correct image registry and deploy to the correct Kubernetes environment.

**VI. Testing & Stability:**
- [ ] Unit tests for backend and frontend achieve target coverage (e.g., >=90%) and pass.
- [ ] E2E tests (if implemented) cover key user flows and pass reliably.
- [ ] Application has been tested for stability over a period of time under expected load.
- [ ] No known critical bugs or regressions that would impact core functionality.

**VII. Documentation:**
- [ ] `README.md` is up-to-date with all setup, configuration, deployment, and troubleshooting steps.
- [ ] All environment variables are documented in `.env.example` and `README.md`.
- [ ] Complex code sections have inline comments explaining their logic.
- [ ] This checklist itself is reviewed and confirmed.