const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(__dirname + '/dist/holopod-content'));
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname +
    '/dist/holopod-content/index.html'));
});

console.log("app running");

app.listen(process.env.PORT || 8080);