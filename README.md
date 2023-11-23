# heStudio BingWallpaper Get

### Develop Version

This is the Develop version to preview the `v1.4.0` version of the update. The update is detailed at https://storage.hestudio.net/s/LXiX

You can listen for version updates on the Develop branch via `https://unpkg.com/hestudio-bingwallpaper-get@alpha/package.json`.

### Demo and detailed documentation

For details, see <https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html>

### Call method

> Run port at `3000`

#### Get pictures

```text
GET /getimage
```

#### Get image title

```text
GET /gettitle
```

Return parameters:

| Parameters | Description |
|---|---|
| `title` | title |

#### Get image copyright information

```text
GET /getcopyright
```

Return parameters:

| Parameters | Description |
|---|---|
| `copyright` | Copyright information |
| `copyrightlink` | The link corresponding to the copyright information |

### installation method

#### Docker deployment (recommended)

```sh
docker pull hestudio/bingwallpaper_get
docker run -d -p 3000:3000 hestudio/bingwallpaper_get
```

#### Manual installation

```sh
git clone https://github.com/hestudio-community/bing-wallpaper-get.git
cd bing-wallpaper-get
npm install --global pnpm
pnpm install --production
pnpm run server
```

> We will use `pnpm` as the package manager after version 1.3.2. If you deploy in this way, please switch in time to avoid any impact.

#### Install and run via NPM

```sh
npm install hestudio-bingwallpaper-get
echo "require('hestudio-bingwallpaper-get')" >> server.js
node server.js
```
