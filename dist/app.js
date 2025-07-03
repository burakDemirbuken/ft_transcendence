const pageState = {
	current: 'login', // default
};

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
	// Push state without changing visible URL
	history.pushState({ page }, '', location.pathname); // URL hiç değişmez
	loadPage(page);
}

  // Handle browser back/forward
window.addEventListener('popstate', (event) => {
	const page = event.state?.page || 'login';
	loadPage(page);
});

// İlk yükleme
window.addEventListener('load', () => {
	const initialPage = history.state?.page || 'login';
	loadPage(initialPage);
	history.replaceState({ page: initialPage }, '', location.pathname); // ilk state sabit
});
