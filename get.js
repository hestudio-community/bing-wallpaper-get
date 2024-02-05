require('dotenv').config()

const VERSION = '1.4.0'

const express = require('express')
const schedule = require('node-schedule')
const ChildProcess = require('child_process')
const fs = require('fs')
const app = express()
const dayjs = require('dayjs')
const crypto = require('node:crypto')

console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] heStudio BingWallpaper Get version: ${VERSION}`)

const hbwgConfig = {}

// hbwg_tempdir
if (process.env.hbwg_tempdir) hbwgConfig.tempDir = process.env.hbwg_tempdir
else hbwgConfig.tempDir = `${process.cwd()}/tmp`

// check tempdir
if (!fs.existsSync(hbwgConfig.tempDir)) {
  fs.mkdirSync(hbwgConfig.tempDir)
  fs.writeFileSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`, VERSION)
} else {
  // eslint-disable-next-line eqeqeq
  if (!fs.existsSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`) || fs.readFileSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`) != VERSION) {
    ChildProcess.execSync(`rm ${hbwgConfig.tempDir}/ -rf`)
    fs.mkdirSync(hbwgConfig.tempDir)
    fs.writeFileSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`, VERSION)
  }
}

/**
 * Record GET request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const getback = (ip, path) => console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${ip} GET ${path}`)

/**
 * Record POST request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const postback = (ip, path) => console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${ip} POST ${path}`)

/**
 * Record a regular log
 * @param {string} log
 */
const logback = (log) => console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${log}`)

/**
 * Record error log
 * @param {string} err
 */
const logerr = (err) => console.error(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ERROR: ${err}`)

/**
 * Record warning log
 * @param {string} warn
 */
const logwarn = (warn) => console.warn(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] WARN: ${warn}`)

// hbwg_port
if (process.env.hbwg_port) hbwgConfig.port = Number(process.env.hbwg_port)
else hbwgConfig.port = 3000

// hbwg_host
if (process.env.hbwg_host) hbwgConfig.host = process.env.hbwg_host
else hbwgConfig.host = 'https://cn.bing.com'

// hbwg_config
if (process.env.hbwg_config) hbwgConfig.api = hbwgConfig.host + '/HPImageArchive.aspx?' + process.env.hbwg_config
else hbwgConfig.api = hbwgConfig.host + '/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'

// hbwg_header
if (process.env.hbwg_header) hbwgConfig.header = process.env.hbwg_header
else hbwgConfig.header = 'x-real-ip'

// 定时
const rule = new schedule.RecurrenceRule()

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

// external.js
/**
 * @param {string} path external.js path
 */
function LoadExternal (path) {
  function HashVerify () {
    const hash = crypto.createHash('sha256')
    hash.update(fs.readFileSync(`${hbwgConfig.tempDir}/external.min.js`))
    hash.update(fs.readFileSync(path))
    return String(hash.digest('hex'))
  }

  function CacheCreate () {
    ChildProcess.execSync(`npx uglifyjs ${path} -m -o ${hbwgConfig.tempDir}/external.min.js`, {
      cwd: __dirname
    })
    fs.writeFileSync(`${hbwgConfig.tempDir}/.external.hbwg_cahce`, HashVerify())
  }

  // eslint-disable-next-line eqeqeq
  if (fs.existsSync(`${hbwgConfig.tempDir}/external.min.js`) && fs.existsSync(`${hbwgConfig.tempDir}/.external.hbwg_cahce`) && fs.readFileSync(`${hbwgConfig.tempDir}/.external.hbwg_cahce`) == HashVerify()) {
    hbwgConfig.external = require(`${hbwgConfig.tempDir}/external.min.js`)
    logback('An external file has been imported with cache.')
  } else {
    CacheCreate()
    hbwgConfig.external = require(`${hbwgConfig.tempDir}/external.min.js`)
    logback('An external file has been imported.')
  }
}
if (process.env.hbwg_external) LoadExternal(process.env.hbwg_external)
else if (fs.existsSync('./external.js')) LoadExternal(`${process.cwd()}/external.js`)

// wget version verify
if (!ChildProcess.execSync('wget --version').toString().split('\n')[0].includes('GNU Wget')) {
  logerr('Wget not found. Please install it.')
  process.exit(-1)
}

// 1.3.0 Version update prompt
if (typeof hbwgConfig.external !== 'undefined' && hbwgConfig.external.getupdate === false) hbwgConfig.getupdate = false
else hbwgConfig.getupdate = true

if (process.env.hbwg_packageurl) hbwgConfig.packageurl = process.env.hbwg_packageurl
else hbwgConfig.packageurl = 'https://registry.npmjs.com/hestudio-bingwallpaper-get/latest'

if (hbwgConfig.getupdate !== false) {
  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  }
  function AfterGetVersion (src) {
    hbwgConfig.version = src.version
    if (hbwgConfig.version !== VERSION) logwarn(`New Version! ${hbwgConfig.version} is ready.`)
  }
  fetch(hbwgConfig.packageurl, requestOptions)
    .then((response) => response.json())
    .then((result) => AfterGetVersion(result))
}

if (typeof hbwgConfig.external !== 'undefined' && hbwgConfig.external.refreshtime) {
  logback('Timer configuration imported.')
  hbwgConfig.external.refreshtime(rule)
} else {
  rule.hour = 0
  rule.minute = 0
  rule.second = 0
  rule.tz = 'Asia/Shanghai'
}

// refreshtask
if (typeof hbwgConfig.external !== 'undefined' && hbwgConfig.external.refreshtask) {
  hbwgConfig.refreshtask = hbwgConfig.external.refreshtask
}

/**
 *
 * @param {object} bingsrc
 */
const download = (bingsrc) => {
  hbwgConfig.bingsrc = bingsrc
  const url = hbwgConfig.host + bingsrc.images[0].url
  ChildProcess.exec(String(`wget -O ${hbwgConfig.tempDir}/image.jpg ${url}`), () => {
    hbwgConfig.image = fs.readFileSync(`${hbwgConfig.tempDir}/image.jpg`)
  })
  hbwgConfig.copyright = String(bingsrc.images[0].copyright)
  hbwgConfig.copyrightlink = String(bingsrc.images[0].copyrightlink)
  hbwgConfig.title = String(bingsrc.images[0].title)
  if (typeof hbwgConfig.refreshtask === 'function') {
    logwarn('task is running...')
    hbwgConfig.refreshtask()
    logwarn('task is finish.')
  }
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

// eslint-disable-next-line no-unused-vars
const job = schedule.scheduleJob(rule, function () {
  if (hbwgConfig.getupdate !== false) {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    }
    function AfterGetVersion (src) {
      hbwgConfig.version = src.version
      if (hbwgConfig.version !== VERSION) {
        logwarn(`New Version! ${hbwgConfig.version} is ready.`)
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

// Load configuration file
if (typeof hbwgConfig.external !== 'undefined' && hbwgConfig.external.beforestart) {
  logback('Initialization configuration has been imported.')
  hbwgConfig.external.beforestart(app, getback, postback, logback, logerr)
}

// api default configuration
hbwgConfig.apiconfig = {
  getimage: '/getimage',
  gettitle: '/gettitle',
  getcopyright: '/getcopyright',
  debug: false,
  bingsrc: false
}

// api configuration
if (typeof hbwgConfig.external !== 'undefined' && hbwgConfig.external.api) {
  logback('The api configuration has been loaded.')
  // rename
  if (typeof hbwgConfig.external.api.rename.getimage === 'string') hbwgConfig.apiconfig.getimage = String(hbwgConfig.external.api.rename.getimage)
  if (typeof hbwgConfig.external.api.rename.gettitle === 'string') hbwgConfig.apiconfig.gettitle = String(hbwgConfig.external.api.rename.gettitle)
  if (typeof hbwgConfig.external.api.rename.getcopyright === 'string') hbwgConfig.apiconfig.getcopyright = String(hbwgConfig.external.api.rename.getcopyright)
  // ban
  if (Array.isArray(hbwgConfig.external.api.ban)) {
    for (let i = 0; i < hbwgConfig.external.api.ban.length; i++) {
      if (hbwgConfig.external.api.ban[i] === 'getimage') hbwgConfig.apiconfig.getimage = false
      if (hbwgConfig.external.api.ban[i] === 'gettitle') hbwgConfig.apiconfig.gettitle = false
      if (hbwgConfig.external.api.ban[i] === 'getcopyright') hbwgConfig.apiconfig.getcopyright = false
    }
  }
}

// bing source config
if (typeof hbwgConfig.external !== 'undefined' && hbwgConfig.external.bingsrc) {
  if (typeof hbwgConfig.external.bingsrc.url === 'string') hbwgConfig.apiconfig.bingsrc = String(hbwgConfig.external.bingsrc.url)
  else hbwgConfig.apiconfig.bingsrc = '/bingsrc'
} else hbwgConfig.apiconfig.bingsrc = false

// robots.txt
if (typeof hbwgConfig.external !== 'undefined') {
  if (hbwgConfig.external.robots === false) hbwgConfig.robots = false
  else if (typeof hbwgConfig.external.robots === 'string') hbwgConfig.robots = String(hbwgConfig.external.robots)
}
if (typeof hbwgConfig.external === 'undefined' || hbwgConfig.external.robots === true || typeof hbwgConfig.external.robots === 'undefined') {
  hbwgConfig.robots = `
User-agent: *
Disallow: /
  `
}
if (hbwgConfig.robots !== false) {
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    const headip = req.headers[hbwgConfig.header]
    if (headip === undefined) global.ip = req.ip
    else global.ip = headip
    const ip = global.ip
    res.send(hbwgConfig.robots)
    getback(ip, '/robots.txt')
  })
}

if (typeof hbwgConfig.external !== 'undefined' && typeof hbwgConfig.external.rootprogram === 'function') {
  logback('Root directory component imported successfully.')
  hbwgConfig.rootprogram = hbwgConfig.external.rootprogram
}

// 主程序
app.get('/', (req, res) => {
  const headip = req.headers[hbwgConfig.header]
  if (headip === undefined) global.ip = req.ip
  else global.ip = headip
  const ip = global.ip
  if (typeof hbwgConfig.rootprogram === 'function') {
    logback('Root directory component imported successfully.')
    hbwgConfig.rootprogram(req, res, getback, logback, logerr)
  } else res.redirect('https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html')
  getback(ip, '/')
})

if (hbwgConfig.apiconfig.getimage) {
  app.get(hbwgConfig.apiconfig.getimage, (req, res) => {
    const headip = req.headers[hbwgConfig.header]
    if (headip === undefined) global.ip = req.ip
    else global.ip = headip
    const ip = global.ip
    // res.sendFile(`${hbwgConfig.tempDir}image.jpg`)
    res.setHeader('Content-Type', 'image/jpeg')
    res.send(hbwgConfig.image)
    getback(ip, hbwgConfig.apiconfig.getimage)
  })
}

if (hbwgConfig.apiconfig.gettitle) {
  app.get(hbwgConfig.apiconfig.gettitle, (req, res) => {
    const headip = req.headers[hbwgConfig.header]
    if (headip === undefined) global.ip = req.ip
    else global.ip = headip
    const ip = global.ip
    res.send({
      title: hbwgConfig.title
    })
    getback(ip, hbwgConfig.apiconfig.gettitle)
  })
}

if (hbwgConfig.apiconfig.getcopyright) {
  app.get(hbwgConfig.apiconfig.getcopyright, (req, res) => {
    const headip = req.headers[hbwgConfig.header]
    if (headip === undefined) global.ip = req.ip
    else global.ip = headip
    const ip = global.ip
    res.send({
      copyright: hbwgConfig.copyright,
      copyrightlink: hbwgConfig.copyrightlink
    })
    getback(ip, hbwgConfig.apiconfig.getcopyright)
  })
}

if (hbwgConfig.apiconfig.bingsrc) {
  app.get(hbwgConfig.apiconfig.bingsrc, (req, res) => {
    const headip = req.headers[hbwgConfig.header]
    if (headip === undefined) global.ip = req.ip
    else global.ip = headip
    const ip = global.ip
    res.send(hbwgConfig.bingsrc)
    getback(ip, hbwgConfig.apiconfig.bingsrc)
  })
}

// debug
if (typeof hbwgConfig.external !== 'undefined') {
  if (hbwgConfig.external.debug) {
    logwarn('Debug Mode is enable!')
    if (!hbwgConfig.external.debug.url) hbwgConfig.apiconfig.debug = '/debug'
    else hbwgConfig.apiconfig.debug = String(hbwgConfig.external.debug.url)

    if (hbwgConfig.external.debug.passwd) {
      const hash = crypto.createHash('sha256')
      hash.update(hbwgConfig.external.debug.passwd)
      hbwgConfig.DebugPasswd = hash.digest('hex')
    }
  }
}

if (hbwgConfig.apiconfig.debug) {
  app.get(hbwgConfig.apiconfig.debug, (req, res) => {
    const headip = req.headers[hbwgConfig.header]
    if (headip === undefined) global.ip = req.ip
    else global.ip = headip
    const ip = global.ip
    const ShowDebug = () => {
      res.setHeader('Content-Type', 'text/html')
      res.send(`
<!DOCTYPE html>
<html>

<head>
  <title>Debug - heStudio BingWallpaper Get</title>
</head>

<body>
  <h1>Debug Information</h1>
  <div>
    <div>
      <h3>API URL Configurations</h3>
      <div>
        <p>getimage: ${hbwgConfig.apiconfig.getimage}</p>
        <p>gettitle: ${hbwgConfig.apiconfig.gettitle}</p>
        <p>getcopyright: ${hbwgConfig.apiconfig.getcopyright}</p>
        <p>bingsrc: ${hbwgConfig.apiconfig.bingsrc}</p>
      </div>
    </div>
    <div>
      <h3>Source</h3>
      <div>
        <h4>Configurations</h4>
        <div>
          <p>Bing API: ${hbwgConfig.api}</p>
        </div>
        <h4>From Bing</h4>
        <div>
          <p>Title: ${hbwgConfig.title}</p>
          <p>Copyright: ${hbwgConfig.copyright}</p>
          <p>Copyright Link: ${hbwgConfig.copyrightlink}</p>
          <p>Bing Source: ${JSON.stringify(hbwgConfig.bingsrc)}</p>
        </div>
      </div>
    </div>
    <div>
      <h3>Server Configurations</h3>
      <div>
        <p>Port: ${hbwgConfig.port}</p>
        <p>isGetUpdate: ${hbwgConfig.getupdate}</p>
        <p>Update PackageUrl: ${hbwgConfig.packageurl}</p>
        <p>Request header for getting IP: ${hbwgConfig.header}</p>
        <p>Temp Dir: ${hbwgConfig.tempDir}</p>
        <p>robots.txt: ${hbwgConfig.robots}</p>
      </div>
    </div>
    <div>
      <h3>For Developer</h3>
      <div>
        <p>TZ: ${process.env.TZ}</p>
        <p>Program Version: ${VERSION}</p>
        <p>Latest Version: ${hbwgConfig.version}</p>
        <p>Running Dir: ${process.cwd()}</p>
        <p>Core Dir: ${__dirname}</p>
        <p>Temp Dir: ${hbwgConfig.tempDir}</p>
        <p>Node Version: ${process.version}</p>
        <p>Node Dir: ${process.execPath}
        <p>Arch Information: ${process.arch}</p>
        <p>Platform Information: ${process.platform}</p>
        <p>PID: ${process.pid}</p>
        <p>Wget Version: ${ChildProcess.execSync('wget --version').toString().split('\n')[0]}</p>
        <p>Memory Usage: ${process.memoryUsage().rss / 1048576} MB</p>
        <p>Resource Usage ${JSON.stringify(process.resourceUsage())}</p>
      </div>
    </div>
  </div>
</body>

</html>
      `)
    }
    if (hbwgConfig.DebugPasswd) {
      const hash = crypto.createHash('sha256')
      const passwd = req.query.passwd
      if (typeof passwd === 'undefined') hash.update('')
      else hash.update(passwd)
      // eslint-disable-next-line eqeqeq
      if (hash.digest('hex') == hbwgConfig.DebugPasswd) {
        getback(ip, `${hbwgConfig.apiconfig.debug}?passwd=***`)
        ShowDebug()
      } else {
        getback(ip, `${hbwgConfig.apiconfig.debug}?passwd=***`)
        logwarn('Password is wrong!')
        res.setHeader('Content-Type', 'text/html')
        res.status(403).send('<script>alert("Password is wrong!")</script>')
      }
    } else {
      getback(ip, `${hbwgConfig.apiconfig.debug}`)
      ShowDebug()
    }
  })
}

// delete external cache
hbwgConfig.external = undefined

app.listen(hbwgConfig.port, () => {
  logback(`heStudio BingWallpaper Get is running on localhost:${hbwgConfig.port}`)
})
