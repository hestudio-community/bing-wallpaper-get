const { default: axios } = require('axios');
const express = require('express')
const app = express()
const port = 3000
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
 
app.get('/getimage', (req, res) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
    xhr.send();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var r = xhr.responseText;
        var bingsrc = JSON.parse(r);
        axios({
          method: "get",
          url: "https://cn.bing.com"+bingsrc.images[0].url,
          responseType: 'stream'
        })
        .then(function (response) {
          var img = response.data
          res.send(img)
        });
      }
    }
})
app.listen(port, () => {
  console.log(`heStudio BingWallpaper Get is running on localhost:${port}`)
})