let notificationCount = 0;
const notificationContainer = createNotificationContainer();
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: 12px;
		pointer-events: none;
	`;
    document.body.appendChild(container);
    return container;
}
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const notificationId = `notification-${notificationCount++}`;
    notification.id = notificationId;
    // Icon seçimi
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✅';
            break;
        case 'error':
            icon = '❌';
            break;
        case 'info':
            icon = 'ℹ️';
            break;
        default:
            icon = '📢';
    }
    notification.style.cssText = `
		padding: 16px 24px;
		background: ${type === 'success' ? 'rgba(0, 255, 0, 0.1)' : type === 'error' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 255, 0.1)'};
		border: 1px solid ${type === 'success' ? 'rgba(0, 255, 0, 0.3)' : type === 'error' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(0, 255, 255, 0.3)'};
		color: white;
		border-radius: 12px;
		font-weight: 500;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		font-family: 'Inter', sans-serif;
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 250px;
		max-width: 400px;
		pointer-events: auto;
		animation: slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		transform-origin: right center;
		backdrop-filter: blur(10px);
	`;
    notification.innerHTML = `
		<span style="font-size: 20px;">${icon}</span>
		<span style="flex: 1;">${message}</span>
	`;
    notificationContainer.appendChild(notification);
    // Auto remove after 3 seconds with fade out animation
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    // Click to dismiss
    notification.addEventListener('click', function () {
        this.style.animation = 'slideOutRight 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
        setTimeout(() => {
            if (this.parentNode) {
                this.remove();
            }
        }, 300);
    });
    // Hover pause
    notification.addEventListener('mouseenter', function () {
        this.style.animationPlayState = 'paused';
    });
    notification.addEventListener('mouseleave', function () {
        this.style.animationPlayState = 'running';
    });
}
// Add slide animations
const style = document.createElement('style');
style.textContent = `
	@keyframes slideInRight {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}
	@keyframes slideOutRight {
		from { transform: translateX(0); opacity: 1; }
		to { transform: translateX(100%); opacity: 0; }
	}
`;
document.head.appendChild(style);
//# sourceMappingURL=notification.js.map