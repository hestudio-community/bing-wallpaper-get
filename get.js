const express = require('express');
const schedule = require('node-schedule');
const path = require('path');
const shell = require("shelljs");
const app = express();
const port = 3000;
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

function cacheimg() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var r = xhr.responseText;
      var bingsrc = JSON.parse(r);
      var url = "https://cn.bing.com" + bingsrc.images[0].url;
      shell.exec('wget -O image.jpg ' + url);
      global.copyright = bingsrc.images[0].copyright;
      global.copyrightlink = bingsrc.images[0].copyrightlink;
      global.title = bingsrc.images[0].title;
    };
  };
};

// 定时
let rule = new schedule.RecurrenceRule();
// rule.hour =0;
// rule.minute =0;
// rule.second =0;
rule.second = 0;
rule.tz = 'Asia/Shanghai';

let job = schedule.scheduleJob(rule, function () {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var r = xhr.responseText;
      var bingsrc = JSON.parse(r);
      var url = "https://cn.bing.com" + bingsrc.images[0].url;
      shell.exec('wget -O image.jpg ' + url);
      global.copyright = bingsrc.images[0].copyright;
      global.copyrightlink = bingsrc.images[0].copyrightlink;
      global.title = bingsrc.images[0].title;
    };
  };
});

cacheimg();

// 允许跨域
app.all('*', function (req,
  res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") res.send(200);
  else next();
});

app.get('/getimage', (req, res) => {
  res.sendFile(path.join(__dirname, 'image.jpg'));
});

app.get('/gettitle', (req, res) => {
  res.send({
    title: global.title
  });
});

app.get('/getcopyright', (req, res) => {
  res.send({
    copyright: global.copyright,
    copyrightlink: global.copyrightlink
  })
});

app.listen(port, () => {
  console.log(`heStudio BingWallpaper Get is running on localhost:${port}`)
});
