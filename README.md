# is-car-web

You'll need to run this on a web server for AJAX to work properly. If you don't have one, [download one here](https://www.apachefriends.org/index.html).

This project should be placed in, or in some subfolder of, your web server's root directory. This varies based on your server - check the relevant documentation if you're using another one, but for the linked server the directory is [INSTALL DIRECTORY]/htdocs/.

To open this project in a browser, start your server and navigate to http://localhost/is-car-web/ if it's in your web server's root directory - otherwise, extra path information will be necessary.

Be aware that this has only been tested to work in Chrome 62. On other browsers - especially IE - this solution is not guaranteed to work properly.

To run minify.bat you need to [install Node.js and the Node Package Manager](https://nodejs.org/en/) then run the following command:
```
npm install -g uglify-js
```