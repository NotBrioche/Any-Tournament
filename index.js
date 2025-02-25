var express = require("express");
const path = require("path");
var app = express();

const PORT = 3000;

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port  http://localhost:3000");
});
