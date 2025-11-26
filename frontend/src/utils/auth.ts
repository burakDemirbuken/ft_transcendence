
export function getAuthToken(): string | null
{
	const hasCookie = document.cookie.includes('accessToken') || document.cookie.includes('authStatus');
	return hasCookie ? 'cookie-exists' : null;
}

export function setAuthToken(token: string): void
{

    const isHttps = window.location.protocol === 'https:';
    const cookieString = isHttps
        ? `accessToken=${token}; path=/; secure; samesite=lax`
        : `accessToken=${token}; path=/; samesite=lax`;
    document.cookie = cookieString;

}

export function removeAuthToken(): void
{
    const cookieOptions = [
        'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure',
        'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure',
        'authStatus=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'authStatus=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure'
    ];

    cookieOptions.forEach(cookie => {
        document.cookie = cookie;
    });
}

export function isAuthenticated(): boolean
{
    return (getAuthToken() !== null);
}

export function getAuthHeaders(): HeadersInit
{
    return {
        'Content-Type': 'application/json'
    };
}
