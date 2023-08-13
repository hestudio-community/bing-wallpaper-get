require('dotenv').config()

const express = require('express');
const schedule = require('node-schedule');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const dayjs = require('dayjs');


if (fs.existsSync('external.js')) {
  const external = require('./external')
}

if (process.env["hbwg_host"]) {
  host = process.env["hbwg_host"]
} else {
  host = 'https://cn.bing.com'
}

if (process.env["hbwg_config"]) {
  api = host + '/HPImageArchive.aspx?' + process.env["hbwg_config"]
} else {
  api = host + '/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
}

function cacheimg() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', api);
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var r = xhr.responseText;
      var bingsrc = JSON.parse(r);
      var url = host + bingsrc.images[0].url;
      exec(String('wget -O image.jpg ' + url));
      global.copyright = bingsrc.images[0].copyright;
      global.copyrightlink = bingsrc.images[0].copyrightlink;
      global.title = bingsrc.images[0].title;
    };
  };
};

// 定时
let rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.minute = 0;
rule.second = 0;
rule.tz = 'Asia/Shanghai';

let job = schedule.scheduleJob(rule, function () {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', api);
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var r = xhr.responseText;
      var bingsrc = JSON.parse(r);
      var url = host + bingsrc.images[0].url;
      exec(String('wget -O image.jpg ' + url));
      global.copyright = bingsrc.images[0].copyright;
      global.copyrightlink = bingsrc.images[0].copyrightlink;
      global.title = bingsrc.images[0].title;
      console.log("Refresh Successfully!")
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

const getback = (ip, path) => {
  console.log('[' + dayjs().format('YYYY-MM-DD HH:mm:ss') + '] ' + ip + " GET " + path)
}

// 主程序
app.get('/', (req, res) => {
  var ip = req.headers['x-real-ip']
  if (typeof external !== 'undefined') {
    if (external.rootprogram) {
      external.rootprogram(req, res)
    } else {
      res.redirect("https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html")
    }
  } else {
    res.redirect("https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html")
  }
  getback(ip, "/")
})

app.get('/getimage', (req, res) => {
  var ip = req.headers['x-real-ip']
  res.sendFile(path.join(__dirname, 'image.jpg'));
  getback(ip, "/getimage")
});

app.get('/gettitle', (req, res) => {
  var ip = req.headers['x-real-ip']
  res.send({
    title: global.title
  });
  getback(ip, "/gettitle")
});

app.get('/getcopyright', (req, res) => {
  var ip = req.headers['x-real-ip']
  res.send({
    copyright: global.copyright,
    copyrightlink: global.copyrightlink
  })
  getback(ip, "/getcopyright")
});

app.listen(port, () => {
  console.log('[' + dayjs().format('YYYY-MM-DD HH:mm:ss') + '] ' + `heStudio BingWallpaper Get is running on localhost:${port}`)
});
