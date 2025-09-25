import AView from "./AView.js";

let currentFrPage:string = "friends";

function handle_clicks(e) {

	if (e.target.classList.contains("pg-switch")) {
		document.querySelector(`#${currentFrPage}`).classList.remove("pg-actv");
		let frpage = document.querySelector(`.${currentFrPage}`);
		frpage.classList.remove("pg-actv");
		frpage?.setAttribute("inert", "");
		currentFrPage = e.target.id;
		document.querySelector(`#${currentFrPage}`).classList.add("pg-actv");
		frpage = document.querySelector(`.${currentFrPage}`);
		frpage.classList.add("pg-actv");
		frpage?.removeAttribute("inert");
	}
	else if (e.target.classList.contains("option")) {
		// if (e.target.id === "play")
		//	; // send play request
		// else if (e.target.id === "msg")
		//	; // send play request
		// else if (e.target.id === "unfr")
		//	; // send play request
	}
}

async function createFriends() {
	const usr = await fetch("mockdata/friendslist.json");
	const userList = await usr.json();
	for (const user of userList) {
		const div = document.createElement("div");
		// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
		div.innerHTML = `
			<div class="user-profile">
				<div class="user-avatar">
					${user.avatar_url}
				</div>
				<div class="user-info">
					<span class="uname">${user.username}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button id="play" class="option">Play</button>
						<button id="msg" class="option">Message</button>
						<button id="unfr" class="option">Unfriend</button>
					</div>
				</div>
			</div>
		`;
		div.classList.add("friend");
		div.classList.add("online");

		const friends = document.querySelector(".friends");
		console.log(friends);
		friends.appendChild(div);
	}
}

async function createInvites() {
	const usr = await fetch("mockdata/invitelist.json");
	const userList = await usr.json();
	for (const user of userList) {
		const div = document.createElement("div");
		// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
		div.innerHTML = `
			<div class="user-profile">
				<div class="user-avatar">
					${user.avatar_url}
				</div>
				<div class="user-info">
					<span class="uname">${user.username}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button id="undo" class="option">Undo</button>
					</div>
				</div>
			</div>
		`;
		div.classList.add("friend");
		div.classList.add("online");

		const friends = document.querySelector(".invites");
		console.log(friends);
		friends.appendChild(div);
	}
}

async function createRequests() {
	const usr = await fetch("mockdata/requestlist.json");
	const userList = await usr.json();
	for (const user of userList) {
		const div = document.createElement("div");
		// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
		div.innerHTML = `
			<div class="user-profile">
				<div class="user-avatar">
					${user.avatar_url}
				</div>
				<div class="user-info">
					<span class="uname">${user.username}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button id="accept" class="option">Accept</button>
						<button id="decline" class="option">Decline</button>
					</div>
				</div>
			</div>
		`;
		div.classList.add("friend");
		div.classList.add("online");

		const friends = document.querySelector(".requests");
		console.log(friends);
		friends.appendChild(div);
	}
}

async function createBlocked() {
	const usr = await fetch("mockdata/blockedlist.json");
	const userList = await usr.json();
	for (const user of userList) {
		const div = document.createElement("div");
		// <img src="${friend.avatar_url}" alt="${friend.username}'s avatar">
		div.innerHTML = `
			<div class="user-profile">
				<div class="user-avatar">
					${user.avatar_url}
				</div>
				<div class="user-info">
					<span class="uname">${user.username}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button id="unblock" class="option">Unblock</button>
					</div>
				</div>
			</div>
		`;
		div.classList.add("friend");
		div.classList.add("online");

		const friends = document.querySelector(".blocked");
		console.log(friends);
		friends.appendChild(div);
	}
}

export default class extends AView {
	constructor() {
		super();
		this.setTitle("Friends");
	}

	async getHtml(): Promise<string> {
		const response = await fetch("templates/friends.html");
		return await response.text();
	}

	async setDynamicContent() {
		createFriends();
		createInvites();
		createRequests();
		createBlocked();
	}

	async setEventHandlers() {
		document.addEventListener("click", handle_clicks);
	}

	async unsetEventHandlers() {
		document.removeEventListener("click", handle_clicks);
	}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/friends.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		const link = document.querySelector("link[href='styles/friends.css']");
		document.head.removeChild(link);
	}
}
