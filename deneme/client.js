const socket = new WebSocket("ws://localhost:3000/ws");

socket.onmessage = (event) => {
	const li = document.createElement("li");
	li.textContent = "Gelen: " + event.data;
	document.getElementById("messages").appendChild(li);
};

function sendMessage() {
	const msg = document.getElementById("msgInput").value;
	if (socket.readyState === WebSocket.OPEN) {
		socket.send(msg);
	} else {
		alert("Bağlantı henüz hazır değil.");
	}
}
