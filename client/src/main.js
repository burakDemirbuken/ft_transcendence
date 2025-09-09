import App from './App.js';

let app;

$(document).ready(() => {
	app = new App();
});


$('#localGameBtn').on('click', () => {
	app.localGame();
});

$('#aiGameBtn').on('click', () => {
	app.aiGame();
});

$('#customGameBtn').on('click', () => {
	app.customGame();
});

$('#joinCustomRoomBtn').on('click', () => {
	const roomId = $('#customRoomId').val().trim();
	if (roomId) {
		app.joinCustomRoom(roomId);
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
