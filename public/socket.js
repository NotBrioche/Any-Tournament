const ws = new WebSocket("ws://localhost:8080");

const id = document.cookie
  .split("; ")
  .find((row) => row.startsWith("id="))
  ?.split("=")[1];

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type == "code") {
    location.href = `/create/${data.code}`;
  }

  if (data.type == "reload") {
    location.reload();
  }

  if (data.type == "start") {
    location.href = `/online/${data.params.code}`;
  }

  if (data.type == "vote") {
    location.href = `/vote/${data.params.code}`;
  }

  if (data.type == "end") {
    location.href = `/result/${data.params.code}`;
  }

  if (data.type == "lobby") {
    location.href = `/room/${data.params.code}`;
  }

  if (data.type == "kicked") {
    location.href = "/join";
  }
};

function create() {
  new PouchDB("images").destroy();
  const room = document.getElementsByName("roomName")[0].value;

  ws.send(
    JSON.stringify({
      type: "create",
      params: { name: room },
    }),
  );
}

function remove(code) {
  new PouchDB("images").destroy();
  ws.send(
    JSON.stringify({
      type: "remove",
      params: { code: code },
    }),
  );
}

async function join(code) {
  let name = "";
  while (name.length == 0) name = prompt("Please enter your name");

  try {
    const data = await SendAndWait(
      ws,
      JSON.stringify({
        type: "join",
        params: { id: id, code: code, name: name },
      }),
      "join",
    );

    if (data.status == "OK") {
      location.href = `/room/${code}`;
    }
  } catch (e) {
    console.error(e.message);
  }
}

function kick(user, code) {
  ws.send(JSON.stringify({ type: "kick", params: { name: user, code: code } }));
}

function SendAndWait(ws, message, expectedType, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Réponse websocket expirée"));
    }, timeout);

    function onMessage(event) {
      const data = JSON.parse(event.data);

      if (data.type == expectedType) {
        clearTimeout(timer);
        ws.removeEventListener("message", onMessage);
        resolve(data);
      }
    }

    ws.addEventListener("message", onMessage);
    ws.send(message);
  });
}

function images(code, images) {
  ws.send(
    JSON.stringify({
      type: "image",
      params: { code: code, images: images },
    }),
  );
}

function start(code) {
  ws.send(
    JSON.stringify({
      type: "start",
      params: {
        code: code,
      },
    }),
  );
}

function result(code) {
  ws.send(
    JSON.stringify({
      type: "result",
      params: { code: code },
    }),
  );
}

function vote(code) {
  const vote = event.srcElement.innerHTML.trim();

  ws.send(
    JSON.stringify({
      type: "vote",
      params: { code: code, vote: vote },
    }),
  );
}

function restart(code) {
  ws.send(JSON.stringify({ type: "restart", params: { code: code } }));
}
