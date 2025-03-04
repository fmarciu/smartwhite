FROM node:18-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
RUN apk add --no-cache curl
WORKDIR /home/node/app/
COPY package*.json ./
RUN npm install -g http-server
COPY public /home/node/app/public
EXPOSE 3000
CMD ["http-server", "/home/node/app/public", "-p", "3000"]