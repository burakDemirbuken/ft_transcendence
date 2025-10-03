var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function createFriends() {
    return __awaiter(this, void 0, void 0, function* () {
        const usr = yield fetch("mockdata/friendslist.json");
        const userList = yield usr.json();
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
    });
}
function createInvites() {
    return __awaiter(this, void 0, void 0, function* () {
        const usr = yield fetch("mockdata/invitelist.json");
        const userList = yield usr.json();
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
    });
}
function createRequests() {
    return __awaiter(this, void 0, void 0, function* () {
        const usr = yield fetch("mockdata/requestlist.json");
        const userList = yield usr.json();
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
            const req = document.querySelector(".requests");
            const ugrid = req === null || req === void 0 ? void 0 : req.querySelector(".user-grid");
            console.log(ugrid);
            ugrid.appendChild(div);
        }
    });
}
function createBlocked() {
    return __awaiter(this, void 0, void 0, function* () {
        const usr = yield fetch("mockdata/blockedlist.json");
        const userList = yield usr.json();
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
    });
}
export default class extends AView {
    constructor() {
        super();
        this.setTitle("Friends");
    }
    getHtml() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch("templates/friends.html");
            return yield response.text();
        });
    }
    setDynamicContent() {
        return __awaiter(this, void 0, void 0, function* () {
            createFriends();
            createInvites();
            createRequests();
            createBlocked();
        });
    }
    setEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            document.addEventListener("click", handle_clicks);
        });
    }
    unsetEventHandlers() {
        return __awaiter(this, void 0, void 0, function* () {
            document.removeEventListener("click", handle_clicks);
        });
    }
    setStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "styles/friends.css";
            document.head.appendChild(link);
        });
    }
    unsetStylesheet() {
        return __awaiter(this, void 0, void 0, function* () {
            const link = document.querySelector("link[href='styles/friends.css']");
            document.head.removeChild(link);
        });
    }
}
//# sourceMappingURL=Friends.js.map