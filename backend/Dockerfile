FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p data

EXPOSE 4000

CMD ["sh", "-c", "node src/db/seed.js && node src/server.js"]
