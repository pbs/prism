FROM node:22.14-bookworm-slim

RUN apt-get update && apt-get install -y chromium

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci

COPY *.js ./

ENTRYPOINT ["/bin/bash", "-c"]