// List of participants
let participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Hannah', 'Igor', 'Jack', 'Kelly', 'Liam', 'Mona'];

// Function to create the tournament bracket
function createBracket(participants) {
    let numParticipants = participants.length;
    let powerOfTwo = Math.pow(2, Math.ceil(Math.log2(numParticipants))); // The next power of 2
    let byes = powerOfTwo - numParticipants; // Calculate the number of "Byes" needed

    // Add "Byes" if necessary
    for (let i = 0; i < byes; i++) {
        participants.push('Bye');
    }
    return participants;
}

// Function to display the current round's matchups
function displayRound(participants, round) {
    console.log(`Round ${round}:`);
    for (let i = 0; i < participants.length; i += 2) {
        console.log(`${participants[i]} vs ${participants[i+1]}`);
    }
}

// Function to simulate a match and choose a winner
function chooseWinner(player1, player2) {
    // You can replace this with user input or any other logic
    return player1 === 'Bye' ? player2 : player2 === 'Bye' ? player1 : Math.random() > 0.5 ? player1 : player2;
}

// Function to play a round
function playRound(participants) {
    let winners = [];
    for (let i = 0; i < participants.length; i += 2) {
        const winner = chooseWinner(participants[i], participants[i + 1]);
        winners.push(winner);
        console.log(`Winner: ${winner}`);
    }
    return winners;
}

// Main function to manage the tournament
function startTournament(participants) {
    let round = 1;
    let currentRoundParticipants = createBracket(participants);
    
    while (currentRoundParticipants.length > 1) {
        console.log(`\n=== Tournament - Round ${round} ===`);
        displayRound(currentRoundParticipants, round);
        currentRoundParticipants = playRound(currentRoundParticipants);
        round++;
    }
    
    console.log(`\n=== The winner of the tournament is: ${currentRoundParticipants[0]} ===`);
}

// Start the tournament
startTournament(participants);
