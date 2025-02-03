const express = require('express');
const app = express();
app.get('/test', function (req, res) {
  res.send('Hello World');
});

console.log("app running");

app.listen(process.env.PORT || 8080);