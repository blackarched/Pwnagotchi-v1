# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies needed for building and to generate a clean package-lock.json
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Optional: If you have a build step (e.g., TypeScript compilation)
# RUN npm run build

# Now, create a production-only node_modules
RUN npm prune --production
# Alternatively, to be absolutely sure and rebuild from package-lock.json for prod:
# RUN rm -rf node_modules && npm ci --omit=dev


# Stage 2: Production
FROM node:18-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production-only node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy package.json and package-lock.json to ensure consistency and allow `npm start`
COPY --from=builder /app/package*.json ./

# Copy application code from builder stage
# If you have a build step, copy the built output, e.g., /app/dist
COPY --from=builder /app ./
# Example if you had a dist folder:
# COPY --from=builder /app/dist ./dist

# Ensure correct ownership of application files
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose the application port (as defined in .env.example and server.js)
EXPOSE 3001

# Command to run the application
# Ensure your package.json "start" script correctly runs the server.
# e.g., "start": "node server.js" or "node dist/server.js" if compiled
CMD ["npm", "start"]
