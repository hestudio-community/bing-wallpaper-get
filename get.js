const { default: axios } = require('axios');
const express = require('express')
const request = require('request')
const app = express()
const port = 3000
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

// 允许跨域
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Credentials","true");
  if(req.method === "OPTIONS") res.send(200);
  else  next();
});
 
app.get('/getimage', (req, res) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
    xhr.send();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var r = xhr.responseText;
        var bingsrc = JSON.parse(r);
        let url = "https://cn.bing.com"+bingsrc.images[0].url
        if(url.startsWith('http')){
          const options = {
            url,
            method:"GET",
            //headers: req.headers    //如果需要设置请求头，就加上
          }
          request(options, function (error, response, body) {
            if (!error && response.statusCode === 200) {
          //拿到实际请求返回的响应头，根据具体需求来设置给原来的响应头
              let headers = response.headers;
              res.setHeader('content-type',headers['content-type']);
              res.send(body);
            } else {
              res.send(options);
            }
          });
        }
      }
    }
})
app.listen(port, () => {
  console.log(`heStudio BingWallpaper Get is running on localhost:${port}`)
})
