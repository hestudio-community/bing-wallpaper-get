FROM node:latest
ENV APP_HOME /app
RUN mkdir $APP_HOME
WORKDIR $APP_HOME
RUN git init
RUN git remote set-url origin https://gitlab.com/heStudio/bing-wallpaper-get.git
RUN git pull
RUN npm install
ENTRYPOINT cd $APP_HOME/ && npm run server
