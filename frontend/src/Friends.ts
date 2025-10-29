import AView from "./AView.js";
import Profile from "./Profile.js";
import { API_BASE_URL } from "./index.js";
import { showNotification } from "./notification.js";

let currentFrPage:string = "friends";

function handleOverlay(e) {
	if (e.target.classList.contains("prof")) {
		document.querySelector(".overlay").classList.remove("hide-away");
		// Add user profile to overlay
	}
	else if (e.currentTarget.id === "card-exit") {
		document.querySelector(".overlay").classList.add("hide-away");
		// Clear user profile information
	}
}

function subpageSwitch(e) {
	if (e.target.classList.contains("pg-switch")) {
		let fields = document.querySelectorAll(`.${currentFrPage}`);

		for (const field of fields) {
			field.classList.remove("pg-actv");
		}
		let section = document.querySelector(`#${currentFrPage}`);
		section?.setAttribute("inert", "");

		if (e.target.matches(".friends"))
			currentFrPage = "friends";
		else if (e.target.matches(".requests"))
			currentFrPage = "requests";
		else if (e.target.matches(".invites"))
			currentFrPage = "invites";

		fields = document.querySelectorAll(`.${currentFrPage}`);
		for (const field of fields) {
			field.classList.add("pg-actv");
		}
		document.querySelector(`#${currentFrPage}`).removeAttribute("inert");
	}
}

function esc(e: KeyboardEvent) {
	const ol = document.querySelector(".overlay");
	if (e.key === "Escape" && !ol.classList.contains("hide-away"))
		ol.classList.add("hide-away");
}

async function friendRequest(e) {
	e.preventDefault();
	console.log("SEND FRIEND REQUEST!!!");
	const list = await fetch(`${API_BASE_URL}/friend/send?userName=bkorkut&peerName=test0`, {
		method: "POST",
		credentials: "include",
	});
}

async function unfriend(e) {
	console.info("UNFRIEND CLICKED");

	const uname = e.target.closest(".friend").querySelector(".uname").textContent.slice(1);
	const res = await fetch(`${API_BASE_URL}/friend/remove?userName=bkorkut&peerName=${uname}`, {
		method: "POST",
		credentials: "include",
	});

	if (res.ok) {
		showNotification(`You have unfriended @${uname}.`);
		// e.target.closest(".friend").remove();
	} else {
		showNotification(`Could not unfriend @${uname}. Please try again later.`);
	}
}

async function createFriends(list: any) {
	if (!list)
		return ;
	for (const user of list) {
		const div = document.createElement("div");
		div.innerHTML = `
			<div class="user-profile">
				<div class="friend-user-avatar">
					<img src="${user?.avatarUrl ?? "../profile.svg"}" alt="">
				</div>
				<div class="friends-user-info">
					<span class="dname">${user?.displayName ?? user?.userName}</span>
					<span class="uname">@${user?.userName}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button class="option prof">Profile</button>
						<button class="option unfr">Unfriend</button>
					</div>
				</div>
			</div>
			`;
		div.classList.add("friend");
		div.querySelector(".unfr").addEventListener("click", unfriend);

		const friends = document.querySelector("#friends");
		friends.appendChild(div);
	}
}

async function createInvites(list: any) {
	if (!list)
		return ;
	for (const user of list) {
		const div = document.createElement("div");
		div.innerHTML = `
			<div class="user-profile">
				<div class="friend-user-avatar">
					<img src="${user?.avatarUrl ?? "../profile.svg"}" alt="">
				</div>
				<div class="friends-user-info">
					<span class="dname">${user?.displayName ?? user?.username}</span>
					<span class="uname">@${user?.userName}</span>
				</div>
			</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button class="option prof">Profile</button>
						<button class="option undo">Undo</button>
					</div>
				</div>
			</div>
			`;
		div.classList.add("friend");

		const friends = document.querySelector("#invites");
		friends.appendChild(div);
	}
}

async function createRequests(list:any) {
	if (!list)
		return ;
	for (const user of list) {
		const div = document.createElement("div");
		div.innerHTML = `
			<div class="user-profile">
				<div class="friend-user-avatar">
					<img src="${user?.avatarUrl ?? "../profile.svg"}" alt="">
				</div>
				<div class="friends-user-info">
						<span class="dname">${user?.displayName ?? user?.userName}</span>
						<span class="uname">@${user?.userName}</span>
					</div>
				</div>
			<div class="user-actions">
				<div class="user-menu">
					<button class="menu-btn">⋮</button>
					<div class="menu-options">
						<button class="option prof">Profile</button>
						<button class="option accept">Accept</button>
						<button class="option decline">Decline</button>
					</div>
				</div>
			</div>
			`;
		div.classList.add("friend");

		const req = document.querySelector("#requests");
		const ugrid = req?.querySelector(".user-grid");
		ugrid.appendChild(div);
	}
}

async function createOverlay() {
	const card = document.querySelector(".card");
	try {
		let response = await fetch(`templates/profile.html`);
		card.innerHTML += await response.text();

		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/profile.css";
		document.head.appendChild(link);

		const profileInstance = new Profile();
		profileInstance.setEventHandlers();

		let rows = document.querySelectorAll(".tournament-row");
		for (const row of rows)
				row.setAttribute("inert", "");
		rows = document.querySelectorAll(".match-row");
		for (const row of rows)
				row.setAttribute("inert", "");
	} catch {
		showNotification("System error, Please try again later.");
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
		try {
			// const lists = await fetch(`${API_BASE_URL}/friend/list?userName=bkorkut`, {
			const lists = await fetch(`../../mockdata/friendslists.json`, {
				method: "GET",
				credentials: "include",
			});
			const json = await lists.json();
			console.info("FRIENDS PAGE: FETCHED LISTS");
			console.log(lists);
			console.log(json);
			createFriends(json?.friends);
			createRequests(json?.requests);
			createInvites(json?.invitations);
		} catch {
			console.log("fetch failed");
		}
		createOverlay();
	}

	async setEventHandlers() {
		document.addEventListener("click", handleOverlay);
		document.querySelector("#card-exit").addEventListener("click", handleOverlay);
		document.addEventListener("keydown", esc);
		document.querySelector(".friend-nav").addEventListener("click", subpageSwitch);
		document.getElementById("add-friend").addEventListener("click", friendRequest);
	}

	async unsetEventHandlers() {
		document.removeEventListener("click", handleOverlay);
		document.querySelector("#card-exit").removeEventListener("click", handleOverlay);
		document.removeEventListener("keydown", esc);
		document.querySelector(".friend-nav").removeEventListener("click", subpageSwitch);
	}

	async setStylesheet() {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "styles/friends.css"
		document.head.appendChild(link);
	}

	async unsetStylesheet() {
		let link = document.querySelector("link[href='styles/friends.css']");
		document.head.removeChild(link);
		link = document.querySelector("link[href='styles/profile.css']");
		document.head.removeChild(link);
	}
}
