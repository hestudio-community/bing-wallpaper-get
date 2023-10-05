# heStudio BingWallpaper Get

### Demo and detailed documentation
For details, see https://www.hestudio.net/docs/hestudio_bing_wallpaper_get.html

 ### Call method
 > Run port at `3000`
 #### Get pictures
 ```
 GET /getimage
 ```

 #### Get image title
 ```
 GET /gettitle
 ```

 Return parameters:

 | Parameters | Description |
 |---|---|
 | `title` | title |

 #### Get image copyright information
 ```
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
 yarn install --production
 yarn server
 ```

 > We will use yarn as the package manager after version 1.3.0. If you deploy in this way, please switch in time to avoid any impact.

 #### Install and run via NPM
 ```sh
 npm install hestudio-bingwallpaper-get
 echo "require('hestudio-bingwallpaper-get')" >> server.js
 node server.js
 ```