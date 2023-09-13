# heStudio BingWallpaper Get

### Demo 和详细文档
详见 https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html

### 调用方法
> 运行端口在`3000`
#### 获取图片
```
GET /getimage
```

#### 获取图片标题
```
GET /gettitle
```

返回参数：

| 参数 | 说明 |
|---|---|
| `title` | 标题 |

#### 获取图片版权信息
```
GET /getcopyright
```

返回参数：

| 参数 | 说明 |
|---|---|
| `copyright` | 版权信息 |
| `copyrightlink` | 版权信息所对应的链接 |

### 安装方法
#### Docker部署 (推荐)
```sh
docker pull hestudio/bingwallpaper_get
docker run -d -p 3000:3000 hestudio/bingwallpaper_get
```

#### 手动安装
```sh
git clone https://github.com/hestudio-community/bing-wallpaper-get.git
cd bing-wallpaper-get
npm install
npm run server
```

#### 通过NPM安装运行
```sh
npm install hestudio-bingwallpaper-get
echo "require('hestudio-bingwallpaper-get')" >> server.js
node server.js
```
