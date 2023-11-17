require('dotenv').config()

const VERSION = '1.4.0-alpha.1'

const express = require('express')
const schedule = require('node-schedule')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const app = express()
const dayjs = require('dayjs')

const hbwgConfig = {}

if (process.env.hbwg_port) {
  hbwgConfig.port = Number(process.env.hbwg_port)
} else {
  hbwgConfig.port = 3000
}

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

/**
 * Record warning log
 * @param {string} warn
 */
const logwarn = (warn) => {
  console.warn(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] WARN: ${warn}`)
}

if (process.env.hbwg_host) {
  hbwgConfig.host = process.env.hbwg_host
} else {
  hbwgConfig.host = 'https://cn.bing.com'
}

if (process.env.hbwg_config) {
  hbwgConfig.api = hbwgConfig.host + '/HPImageArchive.aspx?' + process.env.hbwg_config
} else {
  hbwgConfig.api = hbwgConfig.host + '/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
}

if (process.env.hbwg_header) {
  hbwgConfig.header = process.env.hbwg_header
} else {
  hbwgConfig.header = 'x-real-ip'
}

// 1.3.0 Version update prompt
logback(`heStudio BingWallpaper Get version: ${VERSION}`)
if (typeof hbwgConfig.external !== 'undefined') {
  if (hbwgConfig.external.getupdate !== undefined) {
    logback('Getting updated components has been disabled.')
    if (hbwgConfig.external.getupdate === false) {
      hbwgConfig.getupdate = false
    } else if (hbwgConfig.external.getupdate === true) {
      hbwgConfig.getupdate = true
    } else {
      logerr('getupdate option should be boolean.')
      process.exit(1)
    }
  }
}

if (process.env.hbwg_packageurl) {
  hbwgConfig.packageurl = process.env.hbwg_packageurl
} else {
  hbwgConfig.packageurl = 'https://raw.githubusercontent.com/hestudio-community/bing-wallpaper-get/main/package.json'
}
if (hbwgConfig.getupdate !== false) {
  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  }
  function AfterGetVersion (src) {
    const version = src.version
    if (version !== VERSION) {
      logwarn(`New Version! ${version} is ready.`)
    }
  }
  fetch(hbwgConfig.packageurl, requestOptions)
    .then((response) => response.json())
    .then((result) => AfterGetVersion(result))
}

/**
 *
 * @param {object} bingsrc
 */
const download = (bingsrc) => {
  const url = hbwgConfig.host + bingsrc.images[0].url
  exec(String('wget -O image.jpg ' + url))
  hbwgConfig.copyright = String(bingsrc.images[0].copyright)
  hbwgConfig.copyrightlink = String(bingsrc.images[0].copyrightlink)
  hbwgConfig.title = String(bingsrc.images[0].title)
  logback('Refresh Successfully!')
}

const cacheimg = () => {
  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  }
  fetch(hbwgConfig.api, requestOptions)
    .then((response) => response.json())
    .then((result) => download(result))
}

// 定时
const rule = new schedule.RecurrenceRule()

if (typeof hbwgConfig.external !== 'undefined') {
  if (hbwgConfig.external.refreshtime) {
    logback('Timer configuration imported.')
    hbwgConfig.external.refreshtime(rule)
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
  if (hbwgConfig.getupdate !== false) {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    }
    function AfterGetVersion (src) {
      const version = src.version
      if (version !== VERSION) {
        logwarn(`New Version! ${version} is ready.`)
      }
    }
    fetch(hbwgConfig.packageurl, requestOptions)
      .then((response) => response.json())
      .then((result) => AfterGetVersion(result))
  }
  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  }
  fetch(hbwgConfig.api, requestOptions)
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
  logwarn,
  hbwgConfig
}

if (process.env.hbwg_external) {
  hbwgConfig.external = require(process.env.hbwg_external)
  logback('An external file has been imported.')
} else if (fs.existsSync('./external.js')) {
  hbwgConfig.external = require(String(process.cwd() + '/external.js'))
  logback('An external file has been imported.')
}

// Load configuration file
if (typeof hbwgConfig.external !== 'undefined') {
  if (hbwgConfig.external.beforestart) {
    logback('Initialization configuration has been imported.')
    hbwgConfig.external.beforestart(app, getback, postback, logback, logerr)
  }
}

// 主程序
app.get('/', (req, res) => {
  const headip = req.headers[hbwgConfig.header]
  if (headip === undefined) {
    const ip = req.ip
    global.ip = ip
  } else {
    const ip = headip
    global.ip = ip
  }
  const ip = global.ip
  if (typeof hbwgConfig.external !== 'undefined') {
    if (hbwgConfig.external.rootprogram) {
      logback('Root directory component imported successfully.')
      hbwgConfig.external.rootprogram(req, res, getback, logback, logerr)
    } else {
      res.redirect('https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html')
    }
  } else {
    res.redirect('https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html')
  }
  getback(ip, '/')
})

app.get('/getimage', (req, res) => {
  const headip = req.headers[hbwgConfig.header]
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
  const headip = req.headers[hbwgConfig.header]
  if (headip === undefined) {
    const ip = req.ip
    global.ip = ip
  } else {
    const ip = headip
    global.ip = ip
  }
  const ip = global.ip
  res.send({
    title: hbwgConfig.title
  })
  getback(ip, '/gettitle')
})

app.get('/getcopyright', (req, res) => {
  const headip = req.headers[hbwgConfig.header]
  if (headip === undefined) {
    const ip = req.ip
    global.ip = ip
  } else {
    const ip = headip
    global.ip = ip
  }
  const ip = global.ip
  res.send({
    copyright: hbwgConfig.copyright,
    copyrightlink: hbwgConfig.copyrightlink
  })
  getback(ip, '/getcopyright')
})

app.listen(hbwgConfig.port, () => {
  logback(`heStudio BingWallpaper Get is running on localhost:${hbwgConfig.port}`)
})
