// const fs = require('fs');
const express = require('express')
const cron = require("node-cron");
const path = require('path');
const shell = require("shelljs");
// const request = require('request')
const app = express()
const port = 3000
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

function downimg() {
  const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
    xhr.send();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var r = xhr.responseText;
        var bingsrc = JSON.parse(r);
        var url = "https://cn.bing.com"+bingsrc.images[0].url
        shell.exec('wget -O image.jpg '+url)
      }
    }
  }


// 允许跨域
app.all('*', function(req,
  res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Credentials","true");
  if(req.method === "OPTIONS") res.send(200);
  else  next();
});
 
app.get('/getimage', (req, res) => {
  downimg()
  res.sendFile(path.join(__dirname, 'image.jpg'))
})
app.listen(port, () => {
  console.log(`heStudio BingWallpaper Get is running on localhost:${port}`)
})
