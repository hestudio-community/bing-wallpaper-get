FROM node:latest
ENV APP_HOME /app
RUN mkdir $APP_HOME
WORKDIR $APP_HOME
RUN npm i hestudio-bing-wallpaper-get
ENTRYPOINT cd $APP_HOME/node_modules/hestudio-bing-wallpaper-get/ && npm run server