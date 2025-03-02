const router = require("express-promise-router")();
const { v4: uuidv4 } = require("uuid");

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

router.get("/tournament", (req, res) => {
  res.render("tournament");
});

router.get("/local", (req, res) => {
  res.render("local");
});

router.get("/online/:code", async (req, res) => {
  const id = req.cookies.id;
  const room = await roomDB.getObject(`/rooms/${req.params.code}`);

  if (id == room.owner) {
    if (!room.battle) {
      res.render("online", { img1: null, img2: null });
      return;
    }

    res.render("online", {
      img1: room.battle[0],
      img2: room.battle[1],
      code: room.code,
    });
  }
});

router.get("/vote", (req, res) => {
  res.render("vote");
});

module.exports = router;
