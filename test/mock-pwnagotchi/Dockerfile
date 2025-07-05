FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY mockPwnagotchiServer.js .

EXPOSE 8666
# This is the port PWNAGOTCHI_API_BASE_URL might point to,
# or a port that pwnagotchiService.js (in test mode) can be configured to hit.

CMD ["npm", "start"]
