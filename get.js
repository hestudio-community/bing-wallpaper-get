require("dotenv").config({ quiet: true, path: `${process.cwd()}/.env` });
const VERSION = "1.4.9";

const express = require("express");
const schedule = require("node-schedule");
const ChildProcess = require("child_process");
const fs = require("fs");
const dayjs = require("dayjs");
const crypto = require("node:crypto");
const bodyParser = require("body-parser");
const cors = require("cors");

console.log(
  `[${dayjs().format(
    "YYYY-MM-DD HH:mm:ss",
  )}] heStudio BingWallpaper Get version: ${VERSION}`,
);

/**
 * Record GET request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const getback = (ip, path) =>
  console.log(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${ip} GET ${path}`);

/**
 * Record POST request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const postback = (ip, path) =>
  console.log(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${ip} POST ${path}`);

/**
 * Record a regular log
 * @param {string} log
 */
const logback = (log) =>
  console.log(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${log}`);

/**
 * Record error log
 * @param {string} err
 */
const logerr = (err) =>
  console.error(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ERROR: ${err}`);

/**
 * Record warning log
 * @param {string} warn
 */
const logwarn = (warn) =>
  console.warn(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] WARN: ${warn}`);

const hbwgConfig = {};

// hbwg_tempdir
if (process.env.hbwg_tempdir) hbwgConfig.tempDir = process.env.hbwg_tempdir;
else hbwgConfig.tempDir = `${process.cwd()}/tmp`;

// check tempdir
if (!fs.existsSync(hbwgConfig.tempDir)) {
  fs.mkdirSync(hbwgConfig.tempDir);
  fs.writeFileSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`, VERSION);
} else {
  if (
    !fs.existsSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`) ||
    fs.readFileSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`) != VERSION
  ) {
    fs.rmSync(hbwgConfig.tempDir, { recursive: true, force: true });
    fs.mkdirSync(hbwgConfig.tempDir);
    fs.writeFileSync(`${hbwgConfig.tempDir}/.version.hbwg_cache`, VERSION);
  }
}

// hbwg_port
if (process.env.hbwg_port) hbwgConfig.port = Number(process.env.hbwg_port);
else hbwgConfig.port = 3000;

// hbwg_host
if (process.env.hbwg_host) hbwgConfig.host = process.env.hbwg_host;
else hbwgConfig.host = "https://cn.bing.com";

// hbwg_config
if (process.env.hbwg_config)
  hbwgConfig.api =
    hbwgConfig.host + "/HPImageArchive.aspx?" + process.env.hbwg_config;
else
  hbwgConfig.api =
    hbwgConfig.host + "/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN";

// hbwg_header
if (process.env.hbwg_header) hbwgConfig.header = process.env.hbwg_header;
else hbwgConfig.header = "x-forwarded-for";

// 定时
const rule = new schedule.RecurrenceRule();

// Derived function
module.exports = {
  getback,
  postback,
  logback,
  logerr,
  logwarn,
  hbwgConfig,
};

// external.js
/**
 * @param {string} path external.js path
 */
function LoadExternal(path) {
  function HashVerify() {
    const hash = crypto.createHash("sha256");
    hash.update(fs.readFileSync(`${hbwgConfig.tempDir}/external.min.js`));
    hash.update(fs.readFileSync(path));
    return String(hash.digest("hex"));
  }

  function CacheCreate() {
    ChildProcess.execSync(
      `npx uglifyjs ${path} -m -o ${hbwgConfig.tempDir}/external.min.js`,
      {
        cwd: __dirname,
      },
    );
    fs.writeFileSync(
      `${hbwgConfig.tempDir}/.external.hbwg_cahce`,
      HashVerify(),
    );
  }

  if (
    fs.existsSync(`${hbwgConfig.tempDir}/external.min.js`) &&
    fs.existsSync(`${hbwgConfig.tempDir}/.external.hbwg_cahce`) &&
    fs.readFileSync(`${hbwgConfig.tempDir}/.external.hbwg_cahce`) ==
      HashVerify()
  ) {
    hbwgConfig.external = require(`${hbwgConfig.tempDir}/external.min.js`);
    logback("An external file has been imported with cache.");
  } else {
    CacheCreate();
    hbwgConfig.external = require(`${hbwgConfig.tempDir}/external.min.js`);
    logback("An external file has been imported.");
  }
}
if (process.env.hbwg_external) LoadExternal(process.env.hbwg_external);
else if (fs.existsSync("./external.js"))
  LoadExternal(`${process.cwd()}/external.js`);

// 1.3.0 Version update prompt
if (
  typeof hbwgConfig.external === "object" &&
  hbwgConfig.external.getupdate === false
)
  hbwgConfig.getupdate = false;
else hbwgConfig.getupdate = true;

if (process.env.hbwg_packageurl)
  hbwgConfig.packageurl = process.env.hbwg_packageurl;
else
  hbwgConfig.packageurl =
    "https://registry.npmjs.com/hestudio-bingwallpaper-get/latest";

if (
  typeof hbwgConfig.external === "object" &&
  hbwgConfig.external.refreshtime
) {
  logback("Timer configuration imported.");
  hbwgConfig.external.refreshtime(rule);
} else {
  rule.hour = 0;
  rule.minute = 0;
  rule.second = 0;
  rule.tz = "Asia/Shanghai";
}

// refreshtask
if (typeof hbwgConfig.external === "object") {
  if (typeof hbwgConfig.external.refreshtask === "function") {
    hbwgConfig.refreshtask = hbwgConfig.external.refreshtask;
    hbwgConfig.AllowRefreshtaskWithFail = false;
  } else if (typeof hbwgConfig.external.refreshtask === "object") {
    if (typeof hbwgConfig.external.refreshtask.refreshtask === "function") {
      hbwgConfig.refreshtask = hbwgConfig.external.refreshtask.refreshtask;
      if (
        typeof hbwgConfig.external.refreshtask.AllowRefreshtaskWithFail ===
        "boolean"
      ) {
        hbwgConfig.AllowRefreshtaskWithFail =
          hbwgConfig.external.refreshtask.AllowRefreshtaskWithFail;
      } else {
        hbwgConfig.AllowRefreshtaskWithFail = false;
      }
    } else {
      logerr(
        "The refreshtask configuration is not a function, please check your external.js file.",
      );
      process.exit(1);
    }
  }
}

function cacheimg() {
  function RunTask(status) {
    function Task() {
      if (typeof hbwgConfig.refreshtask === "function") {
        try {
          logwarn("task is running...");
          hbwgConfig.refreshtask();
          logwarn("task is finish.");
        } catch (e) {
          logerr(`refreshtask: ${e}`);
        }
      }
    }
    if (status) Task();
    else {
      if (hbwgConfig.AllowRefreshtaskWithFail) Task();
      else
        logwarn(
          "Because the regular update of the data was not completed, according to the policy you set up, we did not run your customized scheduler.",
        );
    }
  }
  if (hbwgConfig.getupdate !== false) {
    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };
    function AfterGetVersion(src) {
      hbwgConfig.version = src.version;
      if (hbwgConfig.version !== VERSION)
        logwarn(`New Version! ${hbwgConfig.version} is ready.`);
    }
    fetch(hbwgConfig.packageurl, requestOptions)
      .then((response) => response.json())
      .then(async (result) => await AfterGetVersion(result))
      .catch((error) => logerr(`getupdate: ${error}`));
  }
  fetch(hbwgConfig.api, {
    method: "GET",
    redirect: "follow",
  })
    .then((response) => response.json())
    .then(async (result) => {
      hbwgConfig.bingsrc = result;
      const url = hbwgConfig.host + result.images[0].url;
      await fetch(url, {
        method: "GET",
      })
        .then(async (response) => {
          await response
            .arrayBuffer()
            .then(async (buffer) => {
              await (hbwgConfig.image = Buffer.from(buffer));
              RunTask(true);
            })
            .catch(() => {
              RunTask(false);
            });
        })
        .catch((error) => {
          logerr(`api.getimage: ${error}`);
          RunTask(false);
        });
      hbwgConfig.copyright = String(result.images[0].copyright);
      hbwgConfig.copyrightlink = String(result.images[0].copyrightlink);
      hbwgConfig.title = String(result.images[0].title);
    })
    .catch((error) => {
      logerr(`source.bingsrc: ${error}`);
      RunTask(false);
      if (hbwgConfig.image == undefined) {
        process.exit(1);
      }
    });
  logback("Refresh Successfully!");
}

cacheimg();

// eslint-disable-next-line no-unused-vars
const job = schedule.scheduleJob(rule, async function () {
  cacheimg();
});

// api default configuration
hbwgConfig.apiconfig = {
  getimage: "/getimage",
  gettitle: "/gettitle",
  getcopyright: "/getcopyright",
  debug: false,
  bingsrc: false,
};

// api configuration
if (
  typeof hbwgConfig.external === "object" &&
  typeof hbwgConfig.external.api === "object"
) {
  logback("The api configuration has been loaded.");
  // rename
  if (typeof hbwgConfig.external.api.rename === "object") {
    if (typeof hbwgConfig.external.api.rename.getimage === "string")
      hbwgConfig.apiconfig.getimage = String(
        hbwgConfig.external.api.rename.getimage,
      );
    if (typeof hbwgConfig.external.api.rename.gettitle === "string")
      hbwgConfig.apiconfig.gettitle = String(
        hbwgConfig.external.api.rename.gettitle,
      );
    if (typeof hbwgConfig.external.api.rename.getcopyright === "string")
      hbwgConfig.apiconfig.getcopyright = String(
        hbwgConfig.external.api.rename.getcopyright,
      );
  }
  // ban
  if (Array.isArray(hbwgConfig.external.api.ban)) {
    for (let i = 0; i < hbwgConfig.external.api.ban.length; i++) {
      switch (hbwgConfig.external.api.ban[i]) {
        case "getimage":
          hbwgConfig.apiconfig.getimage = false;
          break;
        case "gettitle":
          hbwgConfig.apiconfig.gettitle = false;
          break;
        case "getcopyright":
          hbwgConfig.apiconfig.getcopyright = false;
          break;
      }
    }
  }
}

// bing source config
if (typeof hbwgConfig.external === "object" && hbwgConfig.external.bingsrc) {
  if (typeof hbwgConfig.external.bingsrc.url === "string")
    hbwgConfig.apiconfig.bingsrc = String(hbwgConfig.external.bingsrc.url);
  else hbwgConfig.apiconfig.bingsrc = "/bingsrc";
} else hbwgConfig.apiconfig.bingsrc = false;

// robots.txt
if (typeof hbwgConfig.external === "object") {
  if (hbwgConfig.external.robots === false) hbwgConfig.robots = false;
  else if (typeof hbwgConfig.external.robots === "string")
    hbwgConfig.robots = String(hbwgConfig.external.robots);
}
if (
  typeof hbwgConfig.external === "undefined" ||
  hbwgConfig.external.robots === true ||
  typeof hbwgConfig.external.robots === "undefined"
) {
  hbwgConfig.robots = `User-agent: *
Disallow: /`;
}

if (
  typeof hbwgConfig.external === "object" &&
  typeof hbwgConfig.external.rootprogram === "function"
) {
  logback("Root directory component imported successfully.");
  hbwgConfig.rootprogram = hbwgConfig.external.rootprogram;
}

// 主程序
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

if (
  typeof hbwgConfig.external === "object" &&
  hbwgConfig.external.beforestart
) {
  logback("Initialization configuration has been imported.");
  hbwgConfig.external.beforestart(app, getback, postback, logback, logerr);
}

app.get("/", (req, res) => {
  const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
  if (typeof hbwgConfig.rootprogram === "function") {
    hbwgConfig.rootprogram(req, res, getback, logback, logerr);
  } else
    res.redirect(
      "https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html",
    );
  getback(ip, "/");
});

if (hbwgConfig.robots !== false) {
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    res.send(hbwgConfig.robots);
    getback(ip, "/robots.txt");
  });
}

if (hbwgConfig.apiconfig.getimage) {
  app.get(hbwgConfig.apiconfig.getimage, (req, res) => {
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    res.setHeader("Content-Type", "image/jpeg");
    res.send(hbwgConfig.image);
    getback(ip, hbwgConfig.apiconfig.getimage);
  });
}

if (hbwgConfig.apiconfig.gettitle) {
  app.get(hbwgConfig.apiconfig.gettitle, (req, res) => {
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    res.send({
      title: hbwgConfig.title,
    });
    getback(ip, hbwgConfig.apiconfig.gettitle);
  });
}

if (hbwgConfig.apiconfig.getcopyright) {
  app.get(hbwgConfig.apiconfig.getcopyright, (req, res) => {
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    res.send({
      copyright: hbwgConfig.copyright,
      copyrightlink: hbwgConfig.copyrightlink,
    });
    getback(ip, hbwgConfig.apiconfig.getcopyright);
  });
}

if (hbwgConfig.apiconfig.bingsrc) {
  app.get(hbwgConfig.apiconfig.bingsrc, (req, res) => {
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    res.send(hbwgConfig.bingsrc);
    getback(ip, hbwgConfig.apiconfig.bingsrc);
  });
}

// debug
if (typeof hbwgConfig.external === "object") {
  if (hbwgConfig.external.debug) {
    logwarn("Debug Mode is enable!");
    hbwgConfig.apiconfig.debug = {};
    if (!hbwgConfig.external.debug.url)
      hbwgConfig.apiconfig.debug.url = "/debug";
    else hbwgConfig.apiconfig.debug.url = String(hbwgConfig.external.debug.url);

    if (hbwgConfig.external.debug.method) {
      if (hbwgConfig.external.debug.method === "POST")
        hbwgConfig.apiconfig.debug.method = "POST";
      else if (hbwgConfig.external.debug.method === "GET")
        hbwgConfig.apiconfig.debug.method = "GET";
      else {
        logerr("Debug method is wrong! Can only be POST or GET.");
        process.exit(1);
      }
    } else hbwgConfig.apiconfig.debug.method = "GET";

    if (hbwgConfig.external.debug.passwd) {
      if (hbwgConfig.apiconfig.debug.method === "GET") {
        logerr(
          "Passwords are not allowed in GET mode, please use POST instead.",
        );
        process.exit(1);
      } else {
        const hash = crypto.createHash("sha256");
        hash.update(hbwgConfig.external.debug.passwd);
        hash.update(VERSION);
        hash.update(String(process.pid));
        hash.update(__dirname);
        hbwgConfig.DebugPasswd = hash.digest("hex");
      }
    }
  }
}

if (hbwgConfig.apiconfig.debug.url) {
  function GetDebugInfo() {
    return `
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
        <p>AllowRefreshtaskWithFail: ${hbwgConfig.AllowRefreshtaskWithFail}</p>
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
        <p>Memory Usage: ${process.memoryUsage().rss / 1048576} MB</p>
        <p>Resource Usage ${JSON.stringify(process.resourceUsage())}</p>
      </div>
    </div>
  </div>
</body>

</html>
      `;
  }
  if (hbwgConfig.apiconfig.debug.method === "POST") {
    app.post(hbwgConfig.apiconfig.debug.url, (req, res) => {
      const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
      const ShowDebug = () => {
        res.setHeader("Content-Type", "text/html");
        res.send(GetDebugInfo());
      };
      if (hbwgConfig.DebugPasswd) {
        const hash = crypto.createHash("sha256");
        const passwd = req.body.passwd;
        if (typeof passwd === "undefined") hash.update("");
        else hash.update(passwd);
        hash.update(VERSION);
        hash.update(String(process.pid));
        hash.update(__dirname);
        if (hash.digest("hex") == hbwgConfig.DebugPasswd) {
          postback(ip, `${hbwgConfig.apiconfig.debug.url}?passwd=***`);
          ShowDebug();
        } else {
          postback(ip, `${hbwgConfig.apiconfig.debug.url}?passwd=***`);
          logwarn("Password is wrong!");
          res.setHeader("Content-Type", "text/html");
          res.status(403).send('<script>alert("Password is wrong!")</script>');
        }
      } else {
        postback(ip, `${hbwgConfig.apiconfig.debug.url}`);
        ShowDebug();
      }
    });
  } else if (hbwgConfig.apiconfig.debug.method === "GET") {
    app.get(hbwgConfig.apiconfig.debug.url, (req, res) => {
      const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
      const ShowDebug = () => {
        res.setHeader("Content-Type", "text/html");
        res.send(GetDebugInfo());
      };
      getback(ip, `${hbwgConfig.apiconfig.debug.url}`);
      ShowDebug();
    });
  }
}

// delete external cache
hbwgConfig.external = undefined;

app
  .listen(hbwgConfig.port, () => {
    logback(
      `heStudio BingWallpaper Get is running on localhost:${hbwgConfig.port}`,
    );
  })
  .on("error", (err) => {
    logerr(`server: ${err}`);
    process.exit(1);
  });
