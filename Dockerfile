FROM node:lts
ENV APP_HOME /app
WORKDIR $APP_HOME
RUN npm install hestudio-bingwallpaper-get
RUN echo "require('hestudio-bingwallpaper-get')" >> server.js
ENTRYPOINT node $APP_HOME/server.js
