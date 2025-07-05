const pageState = {
	current: 'login', // default
};

// Dynamically update page (without reloads)
function loadPage(page) {
	const content = document.getElementById('content');
	pageState.current = page;

	if (page === 'login') {
		content.innerHTML = '<h2>Login</h2><p>Please log in.</p>';
		document.title = "Login";
	} else if (page === 'dashboard') {
		content.innerHTML = '<h2>Dashboard</h2><p>Welcome to your dashboard.</p>';
		document.title = "Dashboard";
	} else if (page === 'reports') {
		content.innerHTML = '<h2>Reports</h2><p>Here are your reports.</p>';
		document.title = "Reports";
	} else {
		content.innerHTML = '<h2>404</h2><p>Page not found.</p>';
	}
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
