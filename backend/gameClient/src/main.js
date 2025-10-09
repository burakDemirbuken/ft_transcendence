import App from './App.js';
import gameConfig from './json/GameConfig.js';
import aiConfig from './json/AiConfig.js';
import tournamentConfig from './json/TournamentConfig.js';
import WebSocketClient from './network/WebSocketClient.js';

const id = _TEST_generateRandomId();
const name = _TEST_generateRandomName();
console.log(`Generated ID: ${id}, Name: ${name}`);

const roomSocket = new WebSocketClient(window.location.hostname, 3004);

roomSocket.onConnect(() => {
	console.log('Connected to room server');
});

roomSocket.onMessage((message) => {
	console.log('Received message from room server:', message);
	switch (message.type) {
		case "started":
			app.start(message.payload.roomId);
			break;
		case "created":
			alert(`Room: ${message.payload.roomId} created successfully`);
			break;
		default:
			console.warn(`Unhandled message type: ${message.type}`);
	}
});

roomSocket.onClose((error) => {
	console.log(`Disconnected from room server: ${error.code} - ${error.reason}`);
});

roomSocket.onError((error) => {
	console.error('Room server connection error:', error);
});

roomSocket.connect("ws/client", { userID: id, userName: name });

let data;
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
	app = new App(id, name);
});


$('#localGameBtn').on('click', () => {
	data = {
		name: `mahmut's Room`,
		gameMode: "local",
		...gameConfig
	};
	roomSocket.send("create", { ...data });
});

$('#aiGameBtn').on('click', () => {
	data = {
		name: `mahmut's AI Room`,
		gameMode: "ai",
		...aiConfig,
		...gameConfig
	};
	roomSocket.send("create", { ...data });
});

$('#createGameBtn').on('click', () => {
	data = {
		name: `mahmut's Classic Room`,
		gameMode: "classic",
		...gameConfig
	};
	roomSocket.send("create", { ...data });
});

$('#joinRoomBtn').on('click', () => {
	const roomId = $('#roomId').val().trim();
	if (roomId) {
		roomSocket.send("join", { roomId });
	} else {
		alert('Please enter a valid Room ID');
	}
});

$('#startGameBtn').on('click', () => {
	roomSocket.send("start", {});
});

$('#nextRoundBtn').on('click', () => {
	roomSocket.send("nextRound", {});
});

$(`#matchTournamentBtn`).on('click', () => {
	roomSocket.send("matchTournament", {});
});

let ready = false;
$('#readyToggle').on('click', () => {
	ready = !ready;
	roomSocket.send("setReady", { isReady: ready });
});

$('#createTournamentBtn').on('click', () => {
	data = {
		name: `mahmut's Tournament Room`,
		gameMode: "tournament",
		...tournamentConfig
	};
	roomSocket.send("create", { ...data });
});

$('#joinTournamentBtn').on('click', () => {
	roomSocket.send("join", { roomId: "Naber" });
	/* const tournamentId = $('#customTournamentId').val().trim();
	if (tournamentId) {
	} else {
		alert('Please enter a valid Tournament ID');
	} */
});
