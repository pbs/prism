FROM node:12.16.2-buster-slim

RUN apt-get update && apt-get install -y chromium

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci

COPY utils.js utils.js
COPY lighthouse.js lighthouse.js
COPY datadog.js datadog.js
COPY index.js index.js

ENTRYPOINT ["/bin/bash", "-c"]