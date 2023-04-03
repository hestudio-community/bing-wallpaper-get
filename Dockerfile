FROM node:latest
ENV APP_HOME /app/bing-wallpaper-get
RUN mkdir /app
RUN git clone https://gitlab.com/heStudio/bing-wallpaper-get.git /app
WORKDIR $APP_HOME
RUN npm install
ENTRYPOINT cd $APP_HOME/ && npm run server
