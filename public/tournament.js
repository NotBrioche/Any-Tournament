async function matchesToPouchDb(matches) {
  await new PouchDB("tournament").destroy();
  const db = new PouchDB("tournament");

  for (let match of matches) {
    await db.put({
      _id: `match_${match.number}`,
      players: match.players,
      result: match.result,
      round: match.round,
    });
  }

  await db.put({ _id: "round", round: 1 });
}

async function getAndLoadImagesFromRound() {
  const db = new PouchDB("tournament");
  const round = await db.get("round");

  let chosen = false;
  document.getElementsByName("image").forEach(async (radio) => {
    if (radio.checked == true) {
      chosen = true;
      db.get(`match_${round.round}`).then((doc) => {
        doc.result = parseInt(radio.id.substring(5));
        return db.put(doc);
      });

      db.allDocs({ include_docs: true }).then(async (results) => {
        for (let i = 0; i < results.rows.length; i++) {
          if (!results.rows[i].doc._id.includes("match")) continue;

          if (results.rows[i].doc.players.includes(`from_${round.round}`)) {
            const index = results.rows[i].doc.players.indexOf(
              `from_${round.round}`,
            );
            const current = await db.get(`match_${round.round}`);

            results.rows[i].doc.players[index] = parseInt(
              current.players[current.result - 1],
            );
            await db.put(results.rows[i].doc);
          }
        }
      });
    }
  });

  if (chosen) {
    const matches = await db.allDocs({ include_docs: false });

    if (round.round + 1 >= matches.total_rows) {
      window.location.href = "/result";
      return;
    }

    db.put({ _id: "round", round: round.round + 1, _rev: round._rev });
  }

  const match = await db.get(`match_${round.round}`);

  document.getElementsByName("image").forEach((radio) => {
    radio.checked = false;
  });
  document.getElementById("nextButton").classList.add("invisible");

  await getLocalImage("img1", match.players[0]);
  await getLocalImage("img2", match.players[1]);

  if (chosen) {
    window.location.reload();
  }
}

getAndLoadImagesFromRound();
addEventListenerToRadios();

function addEventListenerToRadios() {
  document.getElementsByName("image").forEach((radio) => {
    radio.addEventListener("change", () =>
      document.getElementById("nextButton").classList.remove("invisible"),
    );
  });
}
