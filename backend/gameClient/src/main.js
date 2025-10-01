import App from './App.js';
import gameConfig from './json/GameConfig.js';
import aiConfig from './json/AiConfig.js';
import tournamentConfig from './json/TournamentConfig.js';

let app;

$(document).ready(() => {
	app = new App();
});


$('#localGameBtn').on('click', () => {
	app.createRoom("local", { ...gameConfig });
});

$('#aiGameBtn').on('click', () => {
	app.createRoom("ai", { ...aiConfig, ...gameConfig });
});

$('#createGameBtn').on('click', () => {
	app.createRoom("classic", { ...gameConfig });
});

$('#joinRoomBtn').on('click', () => {
	const roomId = $('#roomId').val().trim();
	if (roomId) {
		app.joinRoom(roomId);
	} else {
		alert('Please enter a valid Room ID');
	}
});

$('#startGameBtn').on('click', () => {
	app.startGame();
});

$('#nextRoundBtn').on('click', () => {
	app.nextRound();
});

let ready = false;
$('#readyToggle').on('click', () => {
	ready = !ready;
	app.readyState(ready);
});

$('#createTournamentBtn').on('click', () => {
	app.createRoom("tournament", { ...tournamentConfig });
});

$('#joinTournamentBtn').on('click', () => {
	app.joinRoom("Naber");
	/* const tournamentId = $('#customTournamentId').val().trim();
	if (tournamentId) {
	} else {
		alert('Please enter a valid Tournament ID');
	} */
});
