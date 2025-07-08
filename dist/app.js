const pageState = {
	current: 'login', // default
};

const routes = {
	login: { template: 'login', title: 'Login' },
	home: { template: 'home', title: 'Home' },
	play: { template: 'play', title: 'Play' },
	tourneys: { template: 'tourneys', title: 'Tourneys' },
	chat: { template: 'chat', title: 'Chat' },
	profile: { template: 'profile', title: 'Profile' },
	social: { template: 'social', title: 'Social' },
	settings: { template: 'settings', title: 'Settings' },
	aboutUs: { template: 'aboutUs', title: 'About Us' },
}

async function loadTemplate(templateName) {
	const response = await fetch(`templates/${templateName}.html`);
	return await response.text();
}

// Dynamically update page (without reloads)
async function loadPage(page) {
	const content = document.getElementById('content');
	const sidebar = document.querySelector('nav.sidebar'); // Get the sidebar
	pageState.current = page;

	if (page === 'login') {
		sidebar.classList.add('hidden'); // Hide on login
	} else {
		sidebar.classList.remove('hidden'); // Show on other pages
	}

	const route = routes[page];
	if (route) {
		content.innerHTML = await loadTemplate(route.template);
		document.title = route.title;
	} else {
		content.innerHTML = '<h2>404</h2><p>Page not found.</p>';
	}
}

document.querySelector(".menu-toggle").addEventListener("click", () => {
	const sidebar = document.querySelector(".sidebar")
	sidebar.classList.toggle("collapsed");
	const newWidth = sidebar.classList.contains("collapsed") ? "80px" : "250px"
	document.documentElement.style.setProperty('--sidebar-width', newWidth);
});

function navigate(page) {
	history.pushState({ page }, '', `/${page}`);
	loadPage(page);
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
	const page = event.state?.page || 'login';
	loadPage(page);
});

// Initial load and page reloads
window.addEventListener('load', () => {
	const urlPage = window.location.pathname.slice(1);
	const initialPage = urlPage || history.state?.page || 'login';
	loadPage(initialPage);
	history.replaceState({ page: initialPage }, '', `/${initialPage}`);
});
