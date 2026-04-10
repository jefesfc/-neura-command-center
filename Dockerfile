FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p social-posts

EXPOSE 3000

CMD ["node", "server.js"]
