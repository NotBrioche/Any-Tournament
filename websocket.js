const { v4: uuidv4 } = require("uuid");
const { JsonDB, Config } = require("node-json-db");

const db = new JsonDB(new Config("./src/data/rooms", true, true));

// const rooms = { total: 0, rooms: {} };

function createRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (key in db.rooms) {
      if (db.rooms[key] !== undefined) {
        continue;
      }
    }
  } while (false);
  return code;
}

async function WebSocketInit(port) {
  await db.push("/", { total: 0, rooms: {} });

  const { WebSocketServer } = require("ws");

  const wss = new WebSocketServer({ port: port });

  wss.on("connection", (ws, req) => {
    const cookies = req.headers.cookie || "";
    const id =
      cookies
        .split("; ")
        .find((row) => row.startsWith("id="))
        ?.split("=")[1] || uuidv4();

    ws.id = id;

    ws.on("message", (data) => {
      const obj = JSON.parse(data);
      const params = obj.params;

      switch (obj.type) {
        case "create":
          _create(ws, params);
          break;

        case "remove":
          _remove(ws, params);
          break;

        case "join":
          _join(ws, params);
          break;

        case "kick":
          _kick(ws, params);
          break;

        case "image":
          _images(ws, params);
          break;
      }
    });
  });

  async function _create(ws, params) {
    const code = createRoomCode();

    if (ws.room !== undefined) {
      console.log("Client is already in a room");
      return;
    } else {
      ws.room = code;
      ws.send(JSON.stringify({ type: "code", code: code }));
    }

    const data = await db.getObjectDefault(`/rooms/${code}`, null);
    if (data == null) {
      const room = {
        code: code,
        owner: ws.id,
        users: [],
        images: params.images ?? 0,
        name: params.name,
      };

      await db.push(`/rooms/${code}`, room);

      const length = Object.keys(await db.getData("/rooms")).length;
      await db.push(`/total`, length);

      console.log("Created room " + code);
      ws.send(JSON.stringify({ code: code, name: params.name }));
    }
  }

  async function _remove(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room != null) {
      if (room.owner == ws.id) {
        console.log("Deleted room : " + room.code);
        await db.delete(`/rooms/${room.code}`);
      }
    }
  }

  async function _join(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room.users.includes(ws.id)) {
      ws.send(JSON.stringify({ type: "join", status: "DENY" }));
      return;
    }

    if (room.users.length < 100) {
      await db.push(`/rooms/${room.code}/users[]`, {
        name: params.name,
        id: ws.id,
      });
      ws.send(JSON.stringify({ type: "join", status: "OK" }));
      console.log(`${ws.id} joined ${room.code}`);

      wss.clients.forEach((client) => {
        if (client.OPEN && client.id == room.owner) {
          client.send(
            JSON.stringify({
              type: "reload",
            }),
          );
        }
      });
    } else {
      ws.send(JSON.stringify({ type: "join", status: "FULL" }));
    }
  }

  async function _kick(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room !== undefined) {
      if (ws.id == room.owner) {
        for (user of room.users) {
          if (user.name == params.name) {
            const index = room.users.indexOf(user);
            await db.delete(`/rooms/${room.code}/users[${index}]`);

            console.log(`${room.code} owner kicked ${params.name}`);

            ws.send(
              JSON.stringify({
                type: "reload",
              }),
            );
          }
        }
      }
    }
  }

  async function _images(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room != null) {
      if (ws.id == room.owner) {
        if (ws.id == room.owner) {
          await db.push(`/rooms/${room.code}/images`, params.images);
          console.log(`Room ${params.code} has now ${params.images} images`);
        }
      }
    }
  }
}

module.exports = { WebSocketInit, db };
