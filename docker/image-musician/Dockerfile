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

# Install latest npm with package.json copied previously
RUN npm install npm@latest -g

# Starts node
ENTRYPOINT [ "node", "musician.js" ]