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
  db.put({ _id: "round", round: round.round + 1, _rev: round._rev });

  const match = await db.get(`match_${round.round}`);

  await getLocalImage("img1", match.players[0]);
  await getLocalImage("img2", match.players[1]);
}

getAndLoadImagesFromRound();
