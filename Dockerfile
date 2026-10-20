FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=8080 DB_FILE=/data/data.db
EXPOSE 8080
CMD ["npm","start"]
