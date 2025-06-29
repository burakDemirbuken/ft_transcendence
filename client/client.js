let socket;

socket = new WebSocket("ws://localhost:3000/ws");

socket.onopen = () => {
	console.log("WebSocket bağlantısı açıldı");
	const sendButton = document.getElementById("sendBtn");
	sendButton.disabled = false; // Butonu aktif hale getir
}

socket.onmessage = (event) => {
	console.log("📨 Gelen mesaj:", event.data);
	const messagesList = document.getElementById("messages");
	const newMessage = document.createElement("li");
	newMessage.textContent = event.data;
	messagesList.appendChild(newMessage);
	const sendButton = document.getElementById("sendBtn");
};

socket.onclose = () =>
{
	console.log("Bağlantı kapandı");
};

socket.onerror = (e) => console.error('WebSocket hata:', e);

function sendMessage()
{
	const input = document.getElementById("msgInput");
	const message = input.value;

	if (message)
	{
		socket.send(message);
		input.value = ""; // Mesaj gönderildikten sonra input'u temizle
	}
	else
		alert("Lütfen bir mesaj girin.");
}
