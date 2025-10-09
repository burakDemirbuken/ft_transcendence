import AView from "./AView.js";
let currentFrPage = "friends";
function handle_clicks(e) {
    if (e.target.classList.contains("pg-switch")) {
        document.querySelector(`#${currentFrPage}`).classList.remove("pg-actv");
        let frpage = document.querySelector(`.${currentFrPage}`);
        frpage.classList.remove("pg-actv");
        frpage === null || frpage === void 0 ? void 0 : frpage.setAttribute("inert", "");
        currentFrPage = e.target.id;
        document.querySelector(`#${currentFrPage}`).classList.add("pg-actv");
        frpage = document.querySelector(`.${currentFrPage}`);
        frpage.classList.add("pg-actv");
        frpage === null || frpage === void 0 ? void 0 : frpage.removeAttribute("inert");
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
					<span class="dname">${user.dname}</span>
					<span class="uname">${user.uname}</span>
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
					<span class="dname">${user.dname}</span>
					<span class="uname">${user.uname}</span>
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
					<span class="dname">${user.dname}</span>
					<span class="uname">${user.uname}</span>
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
        div.classList.add("online");
        const req = document.querySelector(".requests");
        const ugrid = req === null || req === void 0 ? void 0 : req.querySelector(".user-grid");
        console.log(ugrid);
        ugrid.appendChild(div);
    }
}
export default class extends AView {
    constructor() {
        super();
        this.setTitle("Friends");
    }
    async getHtml() {
        const response = await fetch("templates/friends.html");
        return await response.text();
    }
    async setDynamicContent() {
        createFriends();
        createInvites();
        createRequests();
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
        link.href = "styles/friends.css";
        document.head.appendChild(link);
    }
    async unsetStylesheet() {
        const link = document.querySelector("link[href='styles/friends.css']");
        document.head.removeChild(link);
    }
}
//# sourceMappingURL=Friends.js.map