FROM node:latest

RUN apt-get update && \
    apt-get install nano


COPY src /opt/app/

RUN npm install npm@latest -g

ENTRYPOINT [ "node", "/opt/app/musician.js" ]