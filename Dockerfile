FROM node:14-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY ./src ./src
RUN npm install --quiet --only=production

CMD ["npm", "run", "production"]
