const socket = new WebSocket("ws://localhost:5500/ws");


socket.onopen = () =>
{
	alert("WebSocket bağlantısı kuruldu!");
	sendBtn.disabled = false;  // Butonu aktif hale getir
};

socket.onmessage = function(event)
{
	const li = document.createElement("li");
	li.textContent = "Gelen: " + event.data;
	document.getElementById("messages").appendChild(li);
	console.log("Gelen mesaj:", event.data);
};

function sendMessage()
{
	const msg = document.getElementById("msgInput").value;

	socket.send(msg);
	const li = document.createElement("li");
	li.textContent = "Gönderilen: " + msg;
	document.getElementById("messages").appendChild(li);
	document.getElementById("msgInput").value = ""; // Giriş alanını temizle
}
