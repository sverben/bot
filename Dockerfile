FROM node:16

RUN apt -yy update && apt -yy install ffmpeg

WORKDIR /app
COPY package*.json ./

RUN npm ci

COPY . /app/

CMD [ "node", "index.js" ]