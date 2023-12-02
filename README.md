# heStudio BingWallpaper Get

### Develop Version

This is the Develop version to preview the `v1.4.0` version of the update. The update is detailed at https://storage.hestudio.net/s/LXiX

This is the last alpha release, and we will be releasing a beta version later that focuses on performance scheduling optimizations.

We will make the following schedule of updates:

- alpha: Focus on new feature updates.
- beta: Focus on performance optimization.
- rc: Focus on adapting to more devices.

Thank you for looking forward to our updates, the develop branch will stop updating in the near future, and we will move to the beta branch for updates.We will remove all non-stable branches when the full version is released.

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
