FROM node:latest
ENV APP_HOME /app
RUN mkdir $APP_HOME
WORKDIR $APP_HOME
RUN npm i hestudio-bingwallpaper-get
ENTRYPOINT cd $APP_HOME/node_modules/hestudio-bingwallpaper-get/ && npm run server