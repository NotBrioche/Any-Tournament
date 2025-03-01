const { v4: uuidv4 } = require("uuid");

const rooms = { total: 0, rooms: {} };

function createRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (key in rooms.rooms) {
      if (rooms.rooms[key] !== undefined) {
        continue;
      }
    }
  } while (false);
  return code;
}

function WebSocketInit(port) {
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

  function _create(ws, params) {
    const code = createRoomCode();

    if (ws.room !== undefined) {
      console.log("Client is already in a room");
      return;
    } else {
      ws.room = code;
      ws.send(JSON.stringify({ type: "code", code: code }));
    }

    if (rooms.rooms[code] === undefined) {
      const room = {
        code: code,
        owner: ws.id,
        users: [],
        images: params.images ?? 0,
        name: params.name,
      };

      rooms.rooms[code] = room;
      rooms.total = Object.keys(rooms.rooms).length;
      console.log("Created room " + code);
      ws.send(JSON.stringify({ code: code, name: params.name }));
    } else {
      // console.log("Room " + code + " already exists");
    }
  }

  function _remove(ws, params) {
    for (key of Object.keys(rooms.rooms)) {
      if (rooms.rooms[key].owner == ws.id) {
        console.log("Deleted room : " + rooms.rooms[key].code);
        delete rooms.rooms[key];
      }
    }
  }

  function _join(ws, params) {
    for (user of rooms.rooms[params.code].users) {
      if (user.id == ws.id) {
        ws.send(JSON.stringify({ type: "join", status: "DENY" }));
        return;
      }
    }

    if (rooms.rooms[params.code].users.length < 100) {
      rooms.rooms[params.code].users.push({ name: params.name, id: ws.id });
      ws.send(JSON.stringify({ type: "join", status: "OK" }));
      console.log(`${ws.id} joined ${params.code}`);

      wss.clients.forEach((client) => {
        if (client.OPEN && client.id == rooms.rooms[params.code].owner) {
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

  function _kick(ws, params) {
    if (rooms.rooms[params.code] !== undefined) {
      if (ws.id == rooms.rooms[params.code].owner) {
        for (user of rooms.rooms[params.code].users) {
          if (user.name == params.name) {
            const index = rooms.rooms[params.code].users.indexOf(user);
            rooms.rooms[params.code].users.splice(index, 1);
            console.log(`${params.code} owner kicked ${user.id}`);
            break;
          }
        }

        ws.send(
          JSON.stringify({
            type: "reload",
          }),
        );
      }
    }
  }

  function _images(ws, params) {
    if (rooms.rooms[params.code] !== undefined) {
      if (ws.id == rooms.rooms[params.code].owner) {
        if (ws.id == rooms.rooms[params.code].owner) {
          rooms.rooms[params.code].images = params.images;
          console.log(`Room ${params.code} has now ${params.images} images`);
        }
      }
    }
  }
}

module.exports = { WebSocketInit, rooms, createRoomCode };
