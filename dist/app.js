const pageState = {
	current: 'login', // default
};

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

	if (page === 'login') {
		content.innerHTML = await loadTemplate('login');
		document.title = "Login";
	} else if (page === 'home') {
		content.innerHTML = await loadTemplate('home');
		document.title = "Home";
	} else if (page === 'play') {
		content.innerHTML = await loadTemplate('play');
		document.title = "Play";
	} else if (page === 'tourneys') {
		content.innerHTML = await loadTemplate('tourneys');
		document.title = "Tourneys";
	} else if (page === 'chat') {
		content.innerHTML = await loadTemplate('chat');
		document.title = "Chat";
	} else if (page === 'profile') {
		content.innerHTML = await loadTemplate('profile');
		document.title = "Profile";
	} else if (page === 'social') {
		content.innerHTML = await loadTemplate('social');
		document.title = "Social";
	} else if (page === 'settings') {
		content.innerHTML = await loadTemplate('settings');
		document.title = "Settings";
	} else if (page === 'aboutUs') {
		content.innerHTML = await loadTemplate('aboutUs');
		document.title = "About Us";
	} else {
		content.innerHTML = '<h2>404</h2><p>Page not found.</p>';
	}

	document.querySelector(".menu-toggle").addEventListener("click", () => {
		document.querySelector(".sidebar").classList.toggle("collapsed");
		document.documentElement.style.setProperty('--sidebar-width', '80px');
	});
}

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
