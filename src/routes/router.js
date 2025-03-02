const router = require("express-promise-router")();
const { v4: uuidv4 } = require("uuid");

const { db } = require("../../websocket");

router.get("/", (req, res) => {
  let id = req.cookies.id;

  if (!id) {
    id = uuidv4();
    res.cookie("id", id, { httpOnly: false });
  }

  res.render("index");
});

router.get("/create/:code?", async (req, res) => {
  await db.reload();

  const data = await db.getObjectDefault(`/rooms/${req.params.code}`, null);

  if (data == null && req.params.code !== undefined) {
    res.redirect("/create");
    return;
  }
  res.render("create", { room: data });
});

router.get("/join", async (req, res) => {
  const data = await db.getObjectDefault(`/`, null);

  res.render("join", { total: data.total, rooms: data.rooms });
});

router.get("/tournament", (req, res) => {
  res.render("tournament");
});

router.get("/local", (req, res) => {
  res.render("local");
});

module.exports = router;
