const pageState = {
	current: 'login', // default
};

const routes = {
	login: { template: 'login', title: 'Login' },
	"2fa": { template: '2fa', title: '2fa' },
	register: { template: 'register', title: 'Register' },
	profile: { template: 'profile', title: 'Profile' },
	home: { template: 'home', title: 'Home' },
}

async function loadTemplate(templateName) {
	const response = await fetch(`templates/${templateName}.html`);
	return await response.text();
}

const content = document.querySelector('#content');

async function req(request) {
	const response = await fetch(request);
	const obj = await response.json();
	return obj;
}

async function register(event) {
	event.preventDefault(); // Prevent auto refresh

	const form = new FormData(event.target);

	const user = {
		"username": form.get("username"),
		"email": form.get("email"),
		"password": form.get("password")
	};

	const request = new Request("http://localhost:3000/api/users/register", {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'application/json',
		}),
		body: JSON.stringify(user),
	});
	// 'Authorization': 'Bearer token123' // HEADER
	// cache: 'no-store',
	// mode: 'cors' // CORS handling

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

async function login(event) {
	event.preventDefault(); // Prevent auto refresh

	const form = new FormData(event.target);

	const user = {
		"username": form.get("username"),
		"email": form.get("email"),
		"password": form.get("password")
	};

	const request = new Request("http://localhost:3000/api/users/login", {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'application/json',
		}),
		body: JSON.stringify(user),
	});

	const response = await fetch(request);
	const obj = await response.json();

	if (response.ok)
		navigate("2fa");
	else {
		const test = document.createElement("p");
		test.textContent = `Reply: ${obj.error}, ${user.email}, ${user.username}, ${user.password}`;
		content.appendChild(test);
	}
}

async function login2(event) {
	event.preventDefault();

	// const form = new FormData(event.target);

	// const code = {
	// 	"code": form.get("code"),
	// };

	navigate("profile");
}

async function loadPage(page) {
	const body = document.querySelector('body');
	pageState.current = page;

	const route = routes[page];
	if (route) {
		content.innerHTML = await loadTemplate(route.template);
		document.title = route.title;
	} else {
		content.innerHTML = '<h2>404</h2><p>Page not found.</p>';
	}

	content.querySelector('#loginForm')?.addEventListener("submit", login);
	content.querySelector('#registerForm')?.addEventListener("submit", register);
	content.querySelector('#twofaForm')?.addEventListener("submit", login2);
}

function navigate(page) {
	history.pushState({ page }, '', `/${page}`);
	loadPage(page);
	console.log("navigate called");
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
	const page = event.state.page || 'login';
	loadPage(page);
});

// Initial load and page reloads
window.addEventListener('load', () => {
	const urlPage = window.location.pathname.slice(1);
	const initialPage = urlPage || history.state.page || 'login';
	loadPage(initialPage);
	history.replaceState({ page: initialPage }, '', `/${initialPage}`);
});
