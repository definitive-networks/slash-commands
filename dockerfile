FROM node:12-alpine
WORKDIR /slash-commands
COPY . .
RUN npm install
CMD node ./bot.js