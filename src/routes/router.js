const router = require("express-promise-router")();
const { v4: uuidv4 } = require("uuid");
const { JsonDB, Config } = require("node-json-db");

const { db: roomDB } = require("../services/websocket");

router.get("/", (req, res) => {
  let id = req.cookies.id;

  if (!id) {
    id = uuidv4();
    res.cookie("id", id, { httpOnly: false });
  }

  res.render("index");
});

router.get("/create/:code?", async (req, res) => {
  const data = await roomDB.getObjectDefault(`/rooms/${req.params.code}`, null);

  if (data == null && req.params.code !== undefined) {
    res.redirect("/create");
    return;
  }
  res.render("create", { room: data });
});

router.get("/join", async (req, res) => {
  const data = await roomDB.getObjectDefault(`/`, null);

  res.render("join", { total: data.total, rooms: data.rooms });
});

router.get("/online/:code", async (req, res) => {
  const id = req.cookies.id;
  const room = await roomDB.getObject(`/rooms/${req.params.code}`);

  if (id == room.owner) {
    await roomDB.push(
      `/rooms/${room.code}/roundTimestamp`,
      Date.now() + 10 * 1000,
    );

    res.render("online", {
      img1: room.battle[0],
      img2: room.battle[1],
      room: room,
    });
  }
});

router.get("/local", (req, res) => {
  res.render("local");
});

router.get("/vote/:code", async (req, res) => {
  const room = await roomDB.getObject(`/rooms/${req.params.code}`);

  res.render("vote", { room: room, id: req.cookies.id });
});

router.get("/room/:code", async (req, res) => {
  const room = await roomDB.getObject(`/rooms/${req.params.code}`);

  res.render("room", { room: room });
});

router.get("/result/:code", async (req, res) => {
  const room = await roomDB.getObject(`/rooms/${req.params.code}`);

  const db = new JsonDB(
    new Config(`./src/data/tournaments/${room.code}`, true, true),
  );

  const matches = await db.getObject(`/matches`);
  const winner = await db.getObject(
    `/matches[${matches.length - 1}]/players[${matches[matches.length - 1].result - 1}]`,
  );

  res.render("result", { img: winner, code: room.code });
});

module.exports = router;
