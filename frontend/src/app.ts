const pageState = {
	current: "login", // default
};

const routes = {
	login: { template: "login", title: "Login" },
	"2fa": { template: "2fa", title: "2fa" },
	register: { template: "register", title: "Register" },
	profile: { template: "profile", title: "Profile" },
	home: { template: "home", title: "Home" },
}

async function loadTemplate(templateName) {
	const response = await fetch(`templates/${templateName}.html`);
	return await response.text();
}

const content = document.querySelector("#content");

async function register(event) {
	event.preventDefault(); // Prevent auto refresh

	const form = new FormData(event.target);

	const user = {
		"username": form.get("username"),
		"email": form.get("email"),
		"password": form.get("password")
	};

	const request = new Request("http://localhost:3000/api/users/register", {
		method: "POST",
		headers: new Headers({
			"Content-Type": "application/json",
		}),
		body: JSON.stringify(user),
	});
	// "Authorization": "Bearer token123" // HEADER
	// cache: "no-store",
	// mode: "cors" // CORS handling

	const response = await fetch(request);
	const obj = await response.json();

	const test = document.createElement("p");
	if (response.ok)
		test.textContent = `Reply: ${obj.message}`;
	else if (obj.error)
		test.textContent = `Reply: ${obj.error}`;
	else
		test.textContent = `Reply not found`;
	content.appendChild(test);
}

async function login2(event) {
	event.preventDefault();

	// const form = new FormData(event.target);

	// const code = {
	// 	"code": form.get("code"),
	// };

	navigate("profile");
}

let currentStep = "welcome";
let userRegistered;

function goToNextField(field)
{
	let step = document.querySelector(`.field[data-step="${currentStep}"]`);
	step.classList.remove("active");
	currentStep = field;
	step = document.querySelector(`[data-step="${currentStep}"]`);
	step.classList.add("active");
}

// Enter button handler
async function enter() {
	const form = document.querySelector("#loginForm");
	const formData = new FormData(form);
	let obj;

	switch (currentStep) {
		case "welcome":
			goToNextField("username");
			break;

		case "username":
			const address = `http://localhost:3000/api/users/checkUsername?username=${formData.get("username")}`;
			const response = await fetch(address);
			const json = await response.json();
			if(json.exists) {
				userRegistered = true;
				goToNextField("password");
			} else {
				userRegistered = false;
				goToNextField("email");
			}
			break;

		case "email":
			// check email validity
			goToNextField("password")
			break;

		case "password":
			if (userRegistered) {
				obj = {
					"username": formData.get("username"),
					"password": formData.get("password")
				};
				const request = new Request("http://localhost:3000/api/users/login", {
					method: "POST",
					headers: new Headers({
						"Content-Type": "application/json",
					}),
					body: JSON.stringify(obj),
				});
				const response = await fetch(request);
				const json = await response.json();
				if (response.ok) {
					document.querySelector("#error").textContent = json.message;
					goToNextField("2fa")
				}
				else
					document.querySelector("#error").textContent = json.error;
			} else {
				obj = {
					"username": formData.get("username"),
					"email": formData.get("email"),
					"password": formData.get("password")
				};
				const request = new Request("http://localhost:3000/api/users/register", {
					method: "POST",
					headers: new Headers({
						"Content-Type": "application/json",
					}),
					body: JSON.stringify(obj),
				});
				const response = await fetch(request);
				const json = await response.json();
				if (response.ok) {
					document.querySelector("#error").textContent = json.message;
					goToNextField("welcome")
				}
				else
					document.querySelector("#error").textContent = json.error;
			}
			break;

		case "2fa":
			// send code and get cookies
			navigate("profile");
			break;
	}
};

async function retry() {
	switch (currentStep) {
		case "welcome":
			break;

		case "username":
			goToNextField("welcome");
			break;

		case "email":
			goToNextField("username")
			break;

		case "password":
			if (userRegistered)
				goToNextField("username");
			else
				goToNextField("email");
			break;

		case "2fa":
			goToNextField("password");
			break;
	}
};

async function loadPage(page) {
	const body = document.querySelector("body");
	pageState.current = page;

	const route = routes[page];
	if (route) {
		content.innerHTML = await loadTemplate(route.template);
		document.title = route.title;
	} else {
		content.innerHTML = "<h2>404</h2><p>Page not found.</p>";
	}

	currentStep = "welcome";
	document.querySelector("#enter")?.addEventListener("click", enter);
	document.querySelector("#retry")?.addEventListener("click", retry);
	// content.querySelector("#loginForm")?.addEventListener("submit", login);
	content.querySelector("#registerForm")?.addEventListener("submit", register);
	content.querySelector("#twofaForm")?.addEventListener("submit", login2);
}

function navigate(page) {
	history.pushState({ page }, "", `/${page}`);
	loadPage(page);
	console.log("navigate called");
}

// Handle browser back/forward
window.addEventListener("popstate", (event) => {
	const page = event.state.page || "login";
	loadPage(page);
});

// Initial load and page reloads
window.addEventListener("load", () => {
	const urlPage = window.location.pathname.slice(1);
	const initialPage = urlPage || history.state.page || "login";
	loadPage(initialPage);
	history.replaceState({ page: initialPage }, "", `/${initialPage}`);
});
