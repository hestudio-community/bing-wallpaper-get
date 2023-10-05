require('dotenv').config()

const VERSION = '1.3.0'

const express = require('express')
const schedule = require('node-schedule')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const app = express()
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const dayjs = require('dayjs')

if (process.env.hbwg_port) {
  const port = process.env.hbwg_port
  global.port = port
} else {
  const port = 3000
  global.port = port
}

const port = global.port

const getback = (ip, path) => {
  console.log('[' + dayjs().format('YYYY-MM-DD HH:mm:ss') + '] ' + ip + ' GET ' + path)
}

const postback = (ip, path) => {
  console.log('[' + dayjs().format('YYYY-MM-DD HH:mm:ss') + '] ' + ip + ' POST ' + path)
}

const logback = (log) => {
  console.log('[' + dayjs().format('YYYY-MM-DD HH:mm:ss') + '] ' + log)
}

const logerr = (err) => {
  console.error('[' + dayjs().format('YYYY-MM-DD HH:mm:ss') + '] ERROR: ' + err)
}

if (process.env.hbwg_external) {
  const external = require(process.env.hbwg_external)
  global.external = external
  logback('An external file has been imported.')
} else if (fs.existsSync('./external.js')) {
  const external = require(String(process.cwd() + '/external.js'))
  global.external = external
  logback('An external file has been imported.')
}

const external = global.external

if (process.env.hbwg_host) {
  const host = process.env.hbwg_host
  global.host = host
} else {
  const host = 'https://cn.bing.com'
  global.host = host
}

const host = global.host

if (process.env.hbwg_config) {
  const api = host + '/HPImageArchive.aspx?' + process.env.hbwg_config
  global.api = api
} else {
  const api = host + '/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
  global.api = api
}

const api = global.api

// 1.3.0 Version update prompt
logback(`heStudio BingWallpaper Get version: ${VERSION}`)
if (process.env.hbwg_getupdate !== 'false') {
  const requestOptions = {
    method: 'GET', 
    redirect: 'follow'
  }
  const packageurl = 'https://raw.githubusercontent.com/hestudio-community/bing-wallpaper-get/main/package.json'
  function AfterGetVersion(src) {
    const version = src.version
    if (version !== VERSION) {
      logback(`New Version! ${version} is ready.`)
    }
  }
  fetch(packageurl, requestOptions) 
  .then((response) => response.json()) 
  .then((result) => AfterGetVersion(result))
}

function cacheimg () {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', api)
  xhr.send()
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const r = xhr.responseText
      const bingsrc = JSON.parse(r)
      const url = host + bingsrc.images[0].url
      exec(String('wget -O image.jpg ' + url))
      global.copyright = bingsrc.images[0].copyright
      global.copyrightlink = bingsrc.images[0].copyrightlink
      global.title = bingsrc.images[0].title
    }
  }
}

// 定时
const rule = new schedule.RecurrenceRule()

if (typeof external !== 'undefined') {
  if (external.refreshtime) {
    logback('An external file is being used.')
    external.refreshtime(rule)
  } else {
    rule.hour = 0
    rule.minute = 0
    rule.second = 0
    rule.tz = 'Asia/Shanghai'
  }
} else {
  rule.hour = 0
  rule.minute = 0
  rule.second = 0
  rule.tz = 'Asia/Shanghai'
}

// eslint-disable-next-line no-unused-vars
const job = schedule.scheduleJob(rule, function () {
  if (process.env.hbwg_getupdate !== 'false') {
    const requestOptions = {
      method: 'GET', 
      redirect: 'follow'
    }
    const packageurl = 'https://raw.githubusercontent.com/hestudio-community/bing-wallpaper-get/main/package.json'
    function AfterGetVersion(src) {
      const version = src.version
      if (version !== VERSION) {
        logback(`New Version! ${version} is ready.`)
      }
    }
    fetch(packageurl, requestOptions) 
    .then((response) => response.json()) 
    .then((result) => AfterGetVersion(result))
  }

  const xhr = new XMLHttpRequest()
  xhr.open('GET', api)
  xhr.send()
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const r = xhr.responseText
      const bingsrc = JSON.parse(r)
      const url = host + bingsrc.images[0].url
      exec(String('wget -O image.jpg ' + url))
      global.copyright = bingsrc.images[0].copyright
      global.copyrightlink = bingsrc.images[0].copyrightlink
      global.title = bingsrc.images[0].title
      logback('Refresh Successfully!')
    }
  }
})

cacheimg()

// 允许跨域
app.all('*', function (req,
  res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') res.send(200)
  else next()
})

// 主程序
app.get('/', (req, res) => {
  const headip = req.headers['x-real-ip']
  if (headip === undefined) {
    const ip = req.ip
    global.ip = ip
  } else {
    const ip = headip
    global.ip = ip
  }
  const ip = global.ip
  if (typeof external !== 'undefined') {
    if (external.rootprogram) {
      logback('An external file is being used.')
      external.rootprogram(req, res, getback, logback, logerr)
    } else {
      res.redirect('https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html')
    }
  } else {
    res.redirect('https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html')
  }
  getback(ip, '/')
})

app.get('/getimage', (req, res) => {
  const headip = req.headers['x-real-ip']
  if (headip === undefined) {
    const ip = req.ip
    global.ip = ip
  } else {
    const ip = headip
    global.ip = ip
  }
  const ip = global.ip
  res.sendFile(path.join(process.cwd(), 'image.jpg'))
  getback(ip, '/getimage')
})

app.get('/gettitle', (req, res) => {
  const headip = req.headers['x-real-ip']
  if (headip === undefined) {
    const ip = req.ip
    global.ip = ip
  } else {
    const ip = headip
    global.ip = ip
  }
  const ip = global.ip
  res.send({
    title: global.title
  })
  getback(ip, '/gettitle')
})

app.get('/getcopyright', (req, res) => {
  const headip = req.headers['x-real-ip']
  if (headip === undefined) {
    const ip = req.ip
    global.ip = ip
  } else {
    const ip = headip
    global.ip = ip
  }
  const ip = global.ip
  res.send({
    copyright: global.copyright,
    copyrightlink: global.copyrightlink
  })
  getback(ip, '/getcopyright')
})

if (typeof external !== 'undefined') {
  if (external.beforestart) {
    logback('An external file is being used.')
    external.beforestart(app, getback, postback, logback, logerr)
  }
}

app.listen(port, () => {
  logback(`heStudio BingWallpaper Get is running on localhost:${port}`)
})
