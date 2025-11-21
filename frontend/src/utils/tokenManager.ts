interface TokenInfo {
	accessToken?: string;
	refreshToken?: string;
	user?: any;
	expiresAt?: number;
}

interface ApiResponse {
	success: boolean;
	action?: string;
	user?: any;
	error?: string;
	tokenInfo?: {
		accessTokenExpiry: string;
		refreshTokenExpiry: string;
		rememberMe: boolean;
	};
}

class TokenManager {
	private static instance: TokenManager;
	private tokenInfo: TokenInfo = {};
	private refreshPromise: Promise<boolean> | null = null;
	private readonly API_BASE = `https://${window.location.hostname}:3030/api/auth`;

	private constructor() {
		this.initAutoRefresh();
	}

	public static getInstance(): TokenManager {
		if (!TokenManager.instance) {
			TokenManager.instance = new TokenManager();
		}
		return TokenManager.instance;
	}

	/**
	 * Initialize automatic token refresh mechanism
	 */
	private initAutoRefresh(): void {
		// Check token status every 2 minutes
		setInterval(() => {
			this.checkAndRefreshToken();
		}, 2 * 60 * 1000);

		// Check on page focus
		window.addEventListener('focus', () => {
			this.checkAndRefreshToken();
		});
	}

	/**
	 * Check if token needs refresh and refresh if needed
	 */
	public async checkAndRefreshToken(): Promise<boolean> {
		// Prevent multiple simultaneous refresh requests
		if (this.refreshPromise) {
			return this.refreshPromise;
		}

		this.refreshPromise = this.performTokenCheck();
		const result = await this.refreshPromise;
		this.refreshPromise = null;

		return result;
	}

	/**
	 * Perform actual token check and refresh
	 */
	private async performTokenCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.API_BASE}/auto-refresh`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data: ApiResponse = await response.json();

			if (response.ok && data.success) {
				if (data.action === 'no_refresh_needed') {
					// Token is still valid
					this.tokenInfo.user = data.user;
					return true;
				} else {
					// Token was refreshed
					this.tokenInfo.user = data.user;
					console.log('✅ Token refreshed successfully');
					return true;
				}
			} else if (data.action === 'login_required') {
				// Both tokens are invalid, redirect to login
				this.clearTokenInfo();
				this.redirectToLogin();
				return false;
			}

			return false;

		} catch (error) {
			console.error('❌ Token refresh error:', error);
			return false;
		}
	}

	/**
	 * Login with credentials
	 */
	public async login(credentials: { login: string; code: string; rememberMe?: boolean }): Promise<boolean> {
		try {
			const response = await fetch(`${this.API_BASE}/verify-2fa`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(credentials)
			});

			const data: ApiResponse = await response.json();

			if (response.ok && data.success) {
				this.tokenInfo.user = data.user;
				console.log('✅ Login successful');
				return true;
			} else {
				console.error('❌ Login failed:', data.error);
				return false;
			}

		} catch (error) {
			console.error('❌ Login error:', error);
			return false;
		}
	}

	/**
	 * Logout user
	 */
	public async logout(): Promise<boolean> {
		try {
			const response = await fetch(`${this.API_BASE}/logout`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data: ApiResponse = await response.json();

			if (response.ok && data.success) {
				this.clearTokenInfo();
				console.log('✅ Logout successful');
				return true;
			}

			return false;

		} catch (error) {
			console.error('❌ Logout error:', error);
			return false;
		}
	}

	/**
	 * Make authenticated API request
	 */
	public async apiCall(url: string, options: RequestInit = {}): Promise<Response> {
		// Ensure token is valid before making request
		const tokenValid = await this.checkAndRefreshToken();

		if (!tokenValid) {
			throw new Error('Authentication required');
		}

		// Make the actual request with credentials
		const response = await fetch(url, {
			...options,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			}
		});

		// If unauthorized, try to refresh token once
		if (response.status === 401) {
			const refreshSuccess = await this.checkAndRefreshToken();

			if (refreshSuccess) {
				// Retry the original request
				return fetch(url, {
					...options,
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
						...options.headers
					}
				});
			} else {
				this.redirectToLogin();
				throw new Error('Authentication required');
			}
		}

		return response;
	}

	/**
	 * Get current user info
	 */
	public getCurrentUser(): any {
		return this.tokenInfo.user;
	}

	/**
	 * Check if user is authenticated
	 */
	public isAuthenticated(): boolean {
		return !!this.tokenInfo.user;
	}

	/**
	 * Clear token info
	 */
	private clearTokenInfo(): void {
		this.tokenInfo = {};
	}

	/**
	 * Redirect to login page
	 */
	private redirectToLogin(): void {
		if (window.location.pathname !== '/login') {
			window.location.href = '/login';
		}
	}

	/**
	 * Initialize token manager (called on app start)
	 */
	public async initialize(): Promise<boolean> {
		return this.checkAndRefreshToken();
	}
}

// Export singleton instance
const tokenManager = TokenManager.getInstance();
export default tokenManager;
