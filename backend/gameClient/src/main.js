import App from './App.js';
import gameConfig from './json/GameConfig.js';
import aiConfig from './json/AiConfig.js';
import tournamentConfig from './json/TournamentConfig.js';

let app;


function _TEST_generateRandomId()
{
	return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function _TEST_generateRandomName()
{
	const names = [
		'Player', 'Gamer', 'User', 'Tester', 'Demo',
		'Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'
	];
	const randomName = names[Math.floor(Math.random() * names.length)];
	const randomNumber = Math.floor(Math.random() * 999) + 1;
	return `${randomName}${randomNumber}`;
}

$(document).ready(() => {
	// ulas
	app = new App(_TEST_generateRandomId(), _TEST_generateRandomName());
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
