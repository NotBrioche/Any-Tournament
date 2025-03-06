const { JsonDB, Config } = require("node-json-db");
const fs = require("node:fs");

async function createTournament(players, code) {
  const matches = [];

  const numbers = [...Array(players).keys()];
  shuffle(numbers);
  const db = new JsonDB(
    new Config(`./src/data/tournaments/${code}`, true, true),
  );

  await db.push("/round", 0);
  await db.push("/match", 0);
  await db.push("/matches", []);

  let nearestPow = 1;
  while (nearestPow < players) {
    nearestPow *= 2;
  }

  const nbByes = nearestPow - players;

  nearestPow /= 2;
  const offMatches = nearestPow - nbByes;
  for (let i = 0; i < nearestPow - nbByes; i++) {
    const match = {
      number: i + 1,
      players: [randomAndRemove(numbers), randomAndRemove(numbers)],
      result: 0,
      round: 1,
    };

    matches.push(match);
  }

  nearestPow /= 2;

  for (let i = 0; i < nearestPow; i++) {
    let players;
    if (i >= nearestPow - (nearestPow * 2 - nbByes)) {
      players = [
        randomAndRemove(numbers),
        `from_${(nearestPow - (nearestPow * 2 - nbByes) - i) * -1 + 1}`,
      ];
    } else {
      players = [randomAndRemove(numbers), randomAndRemove(numbers)];
    }

    const match = {
      number: i + nearestPow * 2 - nbByes + 1,
      players: players,
      result: 0,
      round: 2,
    };

    matches.push(match);
  }

  let loop = 0;
  let last = offMatches + 1;

  while (nearestPow > 1) {
    nearestPow /= 2;

    for (let i = 0; i < nearestPow; i++) {
      const match = {
        number: matches.length + 1,
        players: [`from_${last + i * 2}`, `from_${last + i * 2 + 1}`],
        result: 0,
        round: 3 + loop,
      };

      matches.push(match);
    }
    last = matches.length - nearestPow + 1;
    loop++;
  }

  await db.push("/matches", matches);
}

function shuffle(array) {
  for (var i = array.length - 1; i >= 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function randomAndRemove(array) {
  const random = array[Math.floor(Math.random() * array.length)];
  array.splice(array.indexOf(random), 1);

  return random;
}

async function setWinner(code, match, winner) {
  if (winner > 2 || winner < 1) {
    return;
  }

  const db = new JsonDB(
    new Config(`./src/data/tournaments/${code}`, true, true),
  );

  const matchData = await db.getObject(`/matches[${match - 1}]`);
  const winnerValue = matchData.players[winner - 1];

  await db.push(`/matches[${match - 1}]/result`, winner);

  const matches = await db.getObject("/matches");

  for (m in matches) {
    if (matches[m].players.includes(`from_${matchData.number}`)) {
      await db.push(
        `/matches[${m}]/players[${matches[m].players.indexOf(`from_${matchData.number}`)}]`,
        winnerValue,
      );
    }
  }
}

async function getNextBattle(code) {
  if (code === undefined) {
    return;
  }

  const db = new JsonDB(
    new Config(`./src/data/tournaments/${code}`, true, true),
  );

  const tournament = await db.getData("/");

  if (
    tournament.match > 0 &&
    tournament.matches[tournament.match - 1].round != tournament.round
  ) {
    await db.push("/round", tournament.round + 1);
  }

  await db.push("/match", tournament.match + 1);

  return tournament.matches[tournament.match - 1].players;
}

async function getCurrentBattle(code) {
  if (code === undefined) {
    return;
  }

  const db = new JsonDB(
    new Config(`./src/data/tournaments/${code}`, true, true),
  );

  let battle = await db.getObject("/match");
  const totalBattle = await db.getObject("/matches");

  if (battle + 1 > totalBattle.length) {
    battle = -1;
  }

  return battle;
}

async function deleteTournament(code) {
  fs.unlinkSync(`./src/data/tournaments/${code}.json`);
}

module.exports = {
  createTournament,
  getNextBattle,
  setWinner,
  getCurrentBattle,
  deleteTournament,
};
