# 🧠 Pwnagotchi Dashboard

A full-stack dashboard interface for Pwnagotchi devices with live API, WebSocket telemetry, and mesh messaging support.

## 📐 Architecture

```
        ┌─────────────────────┐
        │     Frontend        │
        │  (Vite + React)     │
        └───────┬─────────────┘
                │ /api, /socket
        ┌───────▼─────────────┐
        │     Backend         │
        │ (Express, WS Proxy) │
        └───────┬─────────────┘
                │ http/ws
        ┌───────▼─────────────┐
        │   Pwnagotchi API    │
        └─────────────────────┘
```

## ✅ Prerequisites

- Node.js ≥ 16.x
- Docker & Docker Compose
- (Optional) Certbot for TLS certificates

## ⚙️ Development

### Local Dev

```bash
cp .env.example .env
cd backend && npm install && npm start
cd frontend && npm install && npm run dev
```

### Docker Deployment

```bash
cp .env.example .env
docker-compose up --build
```

## 🌐 Environment Variables

| Key              | Description                          |
|------------------|--------------------------------------|
| `PORT`           | Backend listening port               |
| `CORS_ORIGIN`    | Allowed frontend URL(s)              |
| `PWN_API_URL`    | Internal Pwnagotchi REST endpoint    |
| `PWN_WS_URL`     | Internal Pwnagotchi WebSocket URL    |
| `VITE_API_URL`   | Frontend env var for REST API base   |
| `VITE_WS_URL`    | Frontend env var for WebSocket URL   |

## 🛠 Troubleshooting

- If frontend shows blank: Check `.env` matches correct IPs/domains
- Backend API returns 500: Validate `PWN_API_URL` is reachable
- WebSocket issues: Check firewall/NAT config

## 📊 Monitoring

- Winston logs to stdout (structured JSON)
- Use Docker log drivers, or pipe to ELK/Prometheus stack

## 🚀 CI/CD Pipeline

1. Lint and test Node backend
2. Docker build for backend & frontend
3. Trivy security scan for containers
4. Deploy to self-hosted or cloud container registry

---