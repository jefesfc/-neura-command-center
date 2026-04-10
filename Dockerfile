FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY package.json ./
RUN npm install --omit=dev

# Install and build frontend
COPY client/package.json ./client/
RUN cd client && npm install

COPY . .
RUN cd client && npm run build

RUN mkdir -p social-posts

EXPOSE 3000

CMD ["node", "server.js"]
