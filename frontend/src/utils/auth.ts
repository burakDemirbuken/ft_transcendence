
export function getAuthToken(): string | null
{
	// Sadece cookie'lerde bak
	const hasCookie = document.cookie.includes('accessToken') || document.cookie.includes('authStatus');
	return hasCookie ? 'cookie-exists' : null;
}

export function setAuthToken(token: string): void
{
    console.log("🔐 Setting auth token:", token);

    // Sadece cookie'ye kaydet, localStorage kullanma
    const isHttps = window.location.protocol === 'https:';
    const cookieString = isHttps
        ? `accessToken=${token}; path=/; secure; samesite=lax`
        : `accessToken=${token}; path=/; samesite=lax`;

    console.log("🍪 Setting cookie:", cookieString);
    document.cookie = cookieString;

    // Hemen kontrol et
    console.log("🍪 Cookie after setting:", document.cookie);
    console.log("🔑 Token after setting:", getAuthToken());
}

export function removeAuthToken(): void
{
    console.log('🗑️ Removing all auth cookies');

    // Sadece cookie'leri temizle, localStorage kullanma
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

    console.log('✅ All auth cookies cleared');
    console.log('🍪 Cookies after clearing:', document.cookie);
    console.log('🔑 Has token after clearing:', getAuthToken());
}

export function isAuthenticated(): boolean
{
    return (getAuthToken() !== null);
}

export function getAuthHeaders(): HeadersInit
{
    // HttpOnly cookie'ler kullanıldığı için sadece basic headers
    return {
        'Content-Type': 'application/json'
    };
}
