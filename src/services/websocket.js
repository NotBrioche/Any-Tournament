const { v4: uuidv4 } = require("uuid");
const { JsonDB, Config } = require("node-json-db");
const tournament = require("./tournament");

const db = new JsonDB(new Config("./src/data/rooms", true, true));

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

        case "start":
          _start(ws, params);
          break;

        case "result":
          _result(ws, params);
          break;

        case "vote":
          _vote(ws, params);
          break;

        case "restart":
          _restart(ws, params);
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
        status: "waiting",
        code: code,
        owner: ws.id,
        users: [],
        images: params.images ?? 0,
        name: params.name,
        battle: [null, null],
        first: 0,
        second: 0,
        voted: [],
        roundTimestamp: null,
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

        wss.clients.forEach((client) => {
          if (client.OPEN && room.users.find((user) => user.id == client.id)) {
            client.send(
              JSON.stringify({
                type: "kicked",
              }),
            );
          }
        });
      }
    }
  }

  async function _join(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room == null) return;

    if (room.users.includes(ws.id)) {
      ws.send(JSON.stringify({ type: "join", status: "DENY" }));
      return;
    }

    if (room.status != "waiting") {
      ws.send(JSON.stringify({ type: "join", status: "STARTED" }));
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

            wss.clients.forEach((client) => {
              if (client.OPEN && client.id == user.id) {
                client.send(
                  JSON.stringify({
                    type: "kicked",
                  }),
                );
              }
            });

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
    } else {
      const matches = await tournament.createTournament(params.images);
      ws.send(JSON.stringify({ type: "image", params: { matches: matches } }));
    }
  }

  async function _start(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room != null) {
      if (ws.id == room.owner && room.images > 1 && room.users.length > 0) {
        console.log(
          `${room.code} started tournament with ${room.images} image(s)`,
        );

        await db.push(`/rooms/${room.code}/status`, "playing");

        await tournament.createTournament(room.images, room.code);

        ws.send(JSON.stringify({ type: "start", params: { code: room.code } }));

        wss.clients.forEach((client) => {
          if (client.OPEN) {
            if (room.users.find((user) => user.id == client.id)) {
              client.send(
                JSON.stringify({
                  type: "vote",
                  params: { code: room.code },
                }),
              );
            }
          }
        });

        setTimeout(async () => {
          await db.push(`/rooms/${room.code}/status`, "voting");
          const players = await tournament.getNextBattle(room.code);
          db.push(`/rooms/${room.code}/battle`, players);

          wss.clients.forEach((client) => {
            if (client.OPEN) {
              if (
                client.id == room.owner ||
                room.users.find((user) => user.id == client.id)
              ) {
                client.send(
                  JSON.stringify({
                    type: "reload",
                  }),
                );
              }
            }
          });
        }, 3000);
      }
    }
  }

  async function _result(ws, params, votes = null) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room != null) {
      if (ws.id == room.owner) {
        const battle = await tournament.getCurrentBattle(room.code);

        if (battle == -1) {
          await db.push(`/rooms/${room.code}/status`, "finished");

          wss.clients.forEach((client) => {
            if (client.OPEN) {
              if (room.users.find((user) => user.id == client.id)) {
                client.send(
                  JSON.stringify({
                    type: "reload",
                  }),
                );
              }
            }
          });

          ws.send(JSON.stringify({ type: "end", params: { code: room.code } }));
          return;
        }

        await db.push(`/rooms/${room.code}/voted`, []);
        await db.push(`/rooms/${room.code}/first`, 0);
        await db.push(`/rooms/${room.code}/second`, 0);

        let result;

        if (!votes) {
          result =
            room.first == room.second
              ? Math.round(Math.random()) + 1
              : Math.max(room.first, room.second) == room.first
                ? 1
                : 2;
        } else {
          result =
            votes[0] == votes[1]
              ? Math.round(Math.random()) + 1
              : Math.max(votes[0], votes[1]) == votes[0]
                ? 1
                : 2;
        }

        await tournament.setWinner(room.code, battle, result);

        const players = await tournament.getNextBattle(room.code);
        await db.push(`/rooms/${room.code}/battle`, players);
        ws.send(JSON.stringify({ type: "reload" }));
      }
    }
  }

  async function _vote(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room != null && room.status == "voting") {
      if (room.users.find((user) => user.id == ws.id)) {
        if (room.voted.includes(ws.id)) return;

        if (params.vote == 1) {
          await db.push(`/rooms/${room.code}/first`, room.first + 1);
        } else if (params.vote == 2) {
          await db.push(`/rooms/${room.code}/second`, room.second + 1);
        }

        if (room.voted.length + 1 == room.users.length) {
          let ownerClient;
          wss.clients.forEach((client) => {
            if (client.OPEN) {
              if (client.id == room.owner) {
                return (ownerClient = client);
              }
            }
          });

          await _result(ownerClient, { code: room.code }, [
            room.first + 1,
            room.second + 1,
          ]);
          return;
        }

        await db.push(`/rooms/${room.code}/voted[]`, ws.id);
      }
    }
  }

  async function _restart(ws, params) {
    const room = await db.getObjectDefault(`/rooms/${params.code}`, null);

    if (room != null && ws.id == room.owner && room.status == "finished") {
      await db.push(`/rooms/${room.code}/status`, "waiting");
      await db.push(`/rooms/${room.code}/battle`, [null, null]);
      await db.push(`/rooms/${room.code}/first`, 0);
      await db.push(`/rooms/${room.code}/second`, 0);

      tournament.deleteTournament(room.code);
      ws.send(JSON.stringify({ type: "code", code: room.code }));

      wss.clients.forEach((client) => {
        if (client.OPEN) {
          if (room.users.find((user) => user.id == client.id)) {
            client.send(
              JSON.stringify({
                type: "lobby",
                params: { code: room.code },
              }),
            );
          }
        }
      });
    }
  }
}

module.exports = { WebSocketInit, db };
