# Pull latest node image
FROM node:latest

# Install nano (text editor) and telnet. Not necessary, for debuging.
RUN apt-get update && \
    apt-get install nano && \
    apt-get install telnet

# Set working dir in container
WORKDIR /opt/app

# Copy app source file to container
COPY src ./

RUN npm install

# Starts node
ENTRYPOINT [ "node", "musician.js" ]