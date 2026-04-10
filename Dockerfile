FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY client/package*.json ./client/
RUN cd client && npm install --include=dev

COPY . .
RUN cd client && npm run build

RUN mkdir -p social-posts

EXPOSE 3000
CMD ["node", "server.js"]
