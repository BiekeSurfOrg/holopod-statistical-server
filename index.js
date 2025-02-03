const express = require('express');
const app = express();
const cors = require('cors')
app.use(cors())
app.get('/test', function (req, res) {
  res.send('Hello World');
});

console.log("app running");

app.listen(process.env.PORT || 8080);