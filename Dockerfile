FROM --platform=linux/amd64 node:24-alpine
ENV APP_HOME=/app
ENV NODE_OPTIONS="--no-network-family-autoselection"
WORKDIR $APP_HOME

COPY get.js /tmp
COPY package.json .
COPY bun.lock .

RUN npm install -g bun
RUN bun install --production
RUN npx uglifyjs /tmp/get.js -m -o ./get.js

CMD ["node", "get.js"]
