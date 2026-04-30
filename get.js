const express = require("express");
const cron = require("cron");
const ChildProcess = require("child_process");
const fs = require("fs");
const crypto = require("node:crypto");
const bodyParser = require("body-parser");
const cors = require("cors");
const { DateTime } = require("luxon");
const path = require("node:path");
const dotenv = require("dotenv");

const VERSION = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json")),
).version;

const hbwgConfig = {};

console.log(
  `[${DateTime.now().toISO()}] heStudio BingWallpaper Get version: ${VERSION}`,
);

hbwgConfig.timeZone = DateTime.now().zoneName;

/**
 * Record GET request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const getback = (ip, path) =>
  console.log(`[${DateTime.now().toISO()}] ${ip} GET ${path}`);

/**
 * Record POST request log
 * @param {string} ip ip address
 * @param {string} path URL path visited.
 */
const postback = (ip, path) =>
  console.log(`[${DateTime.now().toISO()}] ${ip} POST ${path}`);

/**
 * Record a regular log
 * @param {string} log
 */
const logback = (log) => console.log(`[${DateTime.now().toISO()}] ${log}`);

/**
 * Record error log
 * @param {string} err
 */
const logerr = (err) =>
  console.error(`[${DateTime.now().toISO()}] ERROR: ${err}`);

/**
 * Record warning log
 * @param {string} warn
 */
const logwarn = (warn) =>
  console.warn(`[${DateTime.now().toISO()}] WARN: ${warn}`);

dotenv.config({ quiet: true, path: `${process.cwd()}/.env` });

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

// port
if (
  typeof hbwgConfig.external != "undefined" &&
  typeof hbwgConfig.external.port == "number"
)
  hbwgConfig.port = hbwgConfig.external.port;
else hbwgConfig.port = 3000;

// bingorigin
if (
  typeof hbwgConfig.external != "undefined" &&
  typeof hbwgConfig.external.bingorigin == "string"
)
  try {
    hbwgConfig.bingorigin = new URL(hbwgConfig.external.bingorigin).origin;
  } catch (e) {
    if (e.code == "ERR_INVALID_URL") {
      logerr("Please configure the correct Bing URL Origin.");
      process.exit(1);
    }
  }
else hbwgConfig.bingorigin = "https://www.bing.com";

// bingregion
if (
  typeof hbwgConfig.external != "undefined" &&
  typeof hbwgConfig.external.bingregion == "string"
)
  hbwgConfig.api =
    hbwgConfig.bingorigin +
    `/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=${hbwgConfig.external.bingregion}`;
else
  hbwgConfig.api =
    hbwgConfig.bingorigin +
    "/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US";

// cdn_header
if (
  typeof hbwgConfig.external != "undefined" &&
  typeof hbwgConfig.external.cdn_header == "string"
)
  hbwgConfig.header = hbwgConfig.external.cdn_header;
else hbwgConfig.header = null;

// 1.3.0 Version update prompt
if (
  typeof hbwgConfig.external === "object" &&
  hbwgConfig.external.getupdate === false
)
  hbwgConfig.getupdate = false;
else hbwgConfig.getupdate = true;

if (
  typeof hbwgConfig.external != "undefined" &&
  typeof hbwgConfig.external.packageurl == "string"
)
  hbwgConfig.packageurl = hbwgConfig.external.packageurl;
else
  hbwgConfig.packageurl =
    "https://registry.npmjs.com/hestudio-bingwallpaper-get/latest";

if (typeof hbwgConfig.external === "object" && hbwgConfig.external.cron) {
  logback("Timer configuration imported.");
  if (
    typeof hbwgConfig.external.cron == "string" &&
    cron.validateCronExpression(hbwgConfig.external.cron).valid
  ) {
    hbwgConfig.cron = hbwgConfig.external.cron;
  } else {
    logerr("Cron verification failed.");
    process.exit(1);
  }
} else {
  hbwgConfig.cron = "0 0 * * *";
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

async function cacheimg() {
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
    await fetch(hbwgConfig.packageurl, requestOptions)
      .then((response) => response.json())
      .then(async (result) => await AfterGetVersion(result))
      .catch((error) => logerr(`getupdate: ${error}`));
  }

  await fetch(hbwgConfig.api, {
    method: "GET",
    redirect: "follow",
  })
    .then((response) => response.json())
    .then(async (result) => {
      hbwgConfig.bingsrc = result;
      const bingImageList = hbwgConfig.bingsrc.images;
      hbwgConfig.bingImageData = [];
      await Promise.all(
        bingImageList.map(async (element, index) => {
          const url = hbwgConfig.bingorigin + element.url;
          try {
            const response = await fetch(url, { method: "GET" });
            const buffer = await response.arrayBuffer();
            hbwgConfig.bingImageData[index] = {
              image: Buffer.from(buffer),
              copyright: String(element.copyright),
              copyrightlink: String(element.copyrightlink),
              title: String(element.title),
            };
            logback(`Refresh Image ${index} Successfully!`);
          } catch (error) {
            logerr(`api.getimage: ${error}`);
            RunTask(false);
          }
        }),
      );
    });
}

const job = cron.CronJob.from({
  cronTime: hbwgConfig.cron,
  onTick: async () => {
    await cacheimg();
    if (hbwgConfig.bingImageData.length < 8) {
      logerr("Resource retrieval failed, the program is about to exit.");
      process.exit(1);
    }
  },
  start: true,
  timeZone: hbwgConfig.timeZone,
  runOnInit: true,
  waitForCompletion: true,
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
if (
  typeof hbwgConfig.external !== "undefined" &&
  typeof hbwgConfig.external.cors != "undefined"
) {
  if (typeof hbwgConfig.external.cors != "object") {
    logerr("CORS must be object.");
    process.exit(1);
  } else {
    hbwgConfig.cors = hbwgConfig.external.cors;
    logback("Custom CORS has been loaded.");
  }
}
app.use(cors(hbwgConfig.cors));

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
    getback(ip, hbwgConfig.apiconfig.getimage);
    let index;
    try {
      index = Number(req.query.index) || 0;
      if (index > 7 || index < 0) {
        res.status(202).send("Please enter an integer from 0 to 7.");
        return;
      }
    } catch {
      res.status(202).send("Please enter an integer from 0 to 7.");
    }
    res.setHeader("Content-Type", "image/jpeg");
    res.send(hbwgConfig.bingImageData[index].image);
  });
}

if (hbwgConfig.apiconfig.gettitle) {
  app.get(hbwgConfig.apiconfig.gettitle, (req, res) => {
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    getback(ip, hbwgConfig.apiconfig.gettitle);
    let index;
    try {
      index = Number(req.query.index) || 0;
      if (index > 7 || index < 0) {
        res.status(202).send("Please enter an integer from 0 to 7.");
        return;
      }
    } catch {
      res.status(202).send("Please enter an integer from 0 to 7.");
    }
    res.send({
      title: hbwgConfig.bingImageData[index].title,
    });
  });
}

if (hbwgConfig.apiconfig.getcopyright) {
  app.get(hbwgConfig.apiconfig.getcopyright, (req, res) => {
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    getback(ip, hbwgConfig.apiconfig.getcopyright);
    let index;
    try {
      index = Number(req.query.index) || 0;
      if (index > 7 || index < 0) {
        res.status(202).send("Please enter an integer from 0 to 7.");
        return;
      }
    } catch {
      res.status(202).send("Please enter an integer from 0 to 7.");
    }
    res.send({
      copyright: hbwgConfig.bingImageData[index].copyright,
      copyrightlink: hbwgConfig.bingImageData[index].copyrightlink,
    });
  });
}

if (hbwgConfig.apiconfig.bingsrc) {
  app.get(hbwgConfig.apiconfig.bingsrc, (req, res) => {
    const ip = req.headers[hbwgConfig.header] || req.connection.remoteAddress;
    getback(ip, hbwgConfig.apiconfig.bingsrc);
    res.send(hbwgConfig.bingsrc);
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
} else if (process.env.hbwg_debug == "true") {
  logwarn("Debug Mode is enable with env!");
  hbwgConfig.apiconfig.debug = {};
  hbwgConfig.apiconfig.debug.url = "/debug";
  hbwgConfig.apiconfig.debug.method = "GET";
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
  <p>Generate Time: ${DateTime.now().toISO()}</p>
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
          ${hbwgConfig.bingImageData.map((element, index) => {
            return `
            <div>
              <h5>Image ${index}</h5>
              <p>Title: ${element.title}</p>
              <p>Copyright: ${element.copyright}</p>
              <p>Copyright Link: ${element.copyrightlink}</p>
            </div>`;
          })}
          <br />
          <p>Bing Source: ${JSON.stringify(hbwgConfig.bingsrc)}</p>
        </div>
      </div>
    </div>
    <div>
      <h3>Cron Configurations</h3>
      <div>
        <p>Cron: ${hbwgConfig.cron}</p>
        <p>Last Execution Time: ${DateTime.fromJSDate(job.lastDate()).toISO()}
        <p>Next Execution Time: ${job.nextDate().toISO()}
        <p>TZ: ${hbwgConfig.timeZone}</p>
        <p>AllowRefreshtaskWithFail: ${typeof hbwgConfig.AllowRefreshtaskWithFail == "boolean" ? hbwgConfig.AllowRefreshtaskWithFail : false}</p>
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
        <p>CORS: ${typeof hbwgConfig.cors == "undefined" ? "undefined" : JSON.stringify(hbwgConfig.cors)}</p>
      </div>
    </div>
    <div>
      <h3>For Developer</h3>
      <div>
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
        <p>CronJob isActive: ${job.isActive}</p>
        <p>CronJob isCallbackRunning: ${job.isCallbackRunning}</p>
        <p>Memory Usage: ${process.memoryUsage().rss / 1000000} MB</p>
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

const serverReady = setInterval(() => {
  if (!job.isCallbackRunning && hbwgConfig.bingImageData.length == 8) {
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
      serverReady.close()
  }
}, 1000);
