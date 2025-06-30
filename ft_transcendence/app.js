function loadPage(page) {
  const contentDiv = document.getElementById('content');

  if (page === 'home') {
    contentDiv.innerHTML = `
      <p>Welcome to the home page!</p>
    `;
    document.title = "SPA Practice - Home";
    history.pushState({}, '', '/');
  }
  else if (page === 'page2') {
    // In a real app, you might fetch this from the server
    fetch('page2.html')
      .then(response => response.text())
      .then(html => {
        contentDiv.innerHTML = html;
        document.title = "SPA Practice - Page 2";
        history.pushState({}, '', '/page2');
      });
  }
}

// Handle browser back/forward buttons
window.onpopstate = function() {
  const path = window.location.pathname;
  if (path === '/page2') {
    loadPage('page2');
	aasdasd;
  } else {
    loadPage('home');
  }
};