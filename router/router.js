const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

const { rooms } = require("../websocket");

router.get("/", (req, res) => {
  let id = req.cookies.id;

  if (!id) {
    id = uuidv4();
    res.cookie("id", id, { httpOnly: false });
  }

  res.render("index");
});

router.get("/create/:code?", (req, res) => {
  if (
    rooms.rooms[req.params.code] === undefined &&
    req.params.code !== undefined
  ) {
    res.redirect("/create");
    return;
  }
  res.render("create", { rooms: rooms, code: req.params.code });
});

router.get("/join", (req, res) => {
  res.render("join", { rooms: rooms });
});

router.get("/tournament", (req, res) => {
  res.render("tournament");
});

router.get("/local", (req, res) => {
  res.render("local");
});

module.exports = router;
