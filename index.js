var express = require("express");
const path = require("path");
const router = require("./src/routes/router");
const cookieParser = require("cookie-parser");
const { WebSocketInit } = require("./websocket");

var app = express();

const PORT = 3000;

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(router);

WebSocketInit(8080);

app.listen(PORT, () => {
  console.log("Listening on port  http://localhost:3000");
});
