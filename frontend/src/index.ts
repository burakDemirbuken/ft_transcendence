import Login from "../dist/Login.js";
import Settings from "../dist/Settings.js";
import Profile from "../dist/Profile.js";
import Play from "../dist/Play.js";
import Friends from "../dist/Friends.js";

const pageState = {
	current: "login", // default
};

const routes = {
	login: { template: "login", view: Login },
	profile: { template: "profile", view: Profile },
	// home: { template: "home", view: Home },
	settings: { template: "settings", view: Settings },
	play: { template: "play", view: Play },
	friends: { template: "friends", view: Friends }
}

let view = null;

const router = async function(page:string) {
	const content = document.querySelector("#content");

	if (view) {
		content?.innerHTML = "";
		view.unsetEventHandlers();
		view.unsetStylesheet();
		view = null;
	}
	pageState.current = page;

	const route = routes[page];
	if (route) {
		view = new route.view();
		view.setStylesheet();
		content.innerHTML = await view.getHtml();
		view.setEventHandlers();
	} else {
		document.title = "Page Not Found";
		content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
	}
}

export function navigateTo(page:string) {
	history.pushState({ page }, "", `/${page}`);
	router(page);
}

document.addEventListener("DOMContentLoaded", () => {
	document.body.addEventListener("click", e => {
		if (e.target.matches("[data-link]")) {
			console.log("hey?")
			e.preventDefault();
			navigateTo(e.target.getAttribute("href").replace(/^\//, ''));
			document.querySelector(".selected")?.classList.toggle("selected");
			e.target.classList.toggle("selected");
		} else if (e.target.matches("[id='toggle']")) {
			console.log("hey");
			document.querySelector("#navbar")?.classList.toggle("collapse");
			document.querySelector(".selected")?.classList.toggle("selected");
			e.target.classList.toggle("selected");
		}
	})
});

// Handle browser back/forward
window.addEventListener("popstate", (event) => {
	const page = event.state.page || "login";
	router(page);
});

// Initial load and page reloads
window.addEventListener("load", () => {
	const urlPage = window.location.pathname.slice(1);
	const initialPage = urlPage || history.state.page || "login";
	router(initialPage);
	history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});
