import App from './App.js';

let app;

$(document).ready(() => {
	app = new App();
});


$('#localGameBtn').on('click', () => {
	app.createRoom("local");
});

$('#aiGameBtn').on('click', () => {
	app.createRoom("ai");
});

$('#createGameBtn').on('click', () => {
	app.createRoom("classic");
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

let ready = false;
$('#readyToggle').on('click', () => {
	ready = !ready;
	app.readyState(ready);
});

$('#createTournamentBtn').on('click', () => {
	app.createTournament();
});

$('#joinTournamentBtn').on('click', () => {
	const tournamentId = $('#customTournamentId').val().trim();
	if (tournamentId) {
		app.joinTournament(tournamentId);
	} else {
		alert('Please enter a valid Tournament ID');
	}
});
