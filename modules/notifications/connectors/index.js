var normalizedPath = require("path").join(__dirname);

require("fs").readdirSync(normalizedPath).forEach(function (file) {
   if (file !== 'index.js') {
      exports[file.replace('.js', '')] = require("./" + file);
   }
});