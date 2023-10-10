require('dotenv').config()

const VERSION = '1.3.1'

const express = require('express')
const schedule = require('node-schedule')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const app = express()
const dayjs = require('dayjs')

if (process.env.hbwg_port) {
  const port = process.env.hbwg_port
  global.port = port
} else {
  const port = 3000
  global.port = port
}

const port = global.port

/**
 * Record GET request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const getback = (ip, path) => {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${ip} GET ${path}`)
}

/**
 * Record POST request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const postback = (ip, path) => {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${ip} POST ${path}`)
}

/**
 * Record a regular log
 * @param {string} log 
 */
const logback = (log) => {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${log}`)
}

/**
 * Record error log
 * @param {string} err 
 */
const logerr = (err) => {
  console.error(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ERROR: ${err}`)
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
if (typeof external !== 'undefined') {
  if (external.getupdate !== undefined) {
    logback('Getting updated components has been disabled.')
    if (external.getupdate === false) {
      global.getupdate = false
    } else if (external.getupdate === true) {
      global.getupdate = true
    } else {
      logerr('getupdate option should be boolean.')
      process.exit(1)
    }
  }
}

/**
 * @deprecated This environment variable will be deprecated in v1.4.0
 * In version v1.3.1, we made a compatibility optimization for the original environment variable switch.
 */
if (process.env.hbwg_getupdate === 'false') {
  global.getupdate = false
  logback('This environment variable will be deprecated in v1.4.0')
} else if (global.getupdate === undefined) {
  global.getupdate = true
}

const getupdate = global.getupdate

if (process.env.hbwg_packageurl) {
  const packageurl = process.env.hbwg_packageurl
  global.packageurl = packageurl
} else {
  const packageurl = 'https://raw.githubusercontent.com/hestudio-community/bing-wallpaper-get/main/package.json'
  global.packageurl = packageurl
}
const packageurl = global.packageurl
if (getupdate !== false) {
  const requestOptions = {
    method: 'GET', 
    redirect: 'follow'
  }
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

function download(bingsrc) {
  const url = host + bingsrc.images[0].url
  exec(String('wget -O image.jpg ' + url))
  global.copyright = bingsrc.images[0].copyright
  global.copyrightlink = bingsrc.images[0].copyrightlink
  global.title = bingsrc.images[0].title
  logback('Refresh Successfully!')
}

function cacheimg () {
  const requestOptions = {
    method: 'GET', 
    redirect: 'follow'
  }
  fetch(api, requestOptions) 
    .then((response) => response.json()) 
    .then((result) => download(result))
}

// 定时
const rule = new schedule.RecurrenceRule()

if (typeof external !== 'undefined') {
  if (external.refreshtime) {
    logback('Timer configuration imported.')
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
  if (getupdate !== false) {
    const requestOptions = {
      method: 'GET', 
      redirect: 'follow'
    }
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
  const requestOptions = {
    method: 'GET', 
    redirect: 'follow'
  }
  fetch(api, requestOptions) 
    .then((response) => response.json()) 
    .then((result) => download(result))
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

// Derived function
module.exports = {
  getback,
  postback,
  logback,
  logerr,
  port,
  api,
  getupdate,
  packageurl,
}

// Load configuration file
if (typeof external !== 'undefined') {
  if (external.beforestart) {
    logback('Initialization configuration has been imported.')
    external.beforestart(app, getback, postback, logback, logerr)
  }
}

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
      logback('Root directory component imported successfully.')
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


app.listen(port, () => {
  logback(`heStudio BingWallpaper Get is running on localhost:${port}`)
})
