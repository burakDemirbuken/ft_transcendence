
export function getAuthToken(): string | null
{
    // HttpOnly cookie'ler kullanıldığı için JavaScript'ten erişim yok
    // Bu fonksiyon sadece backward compatibility için kalıyor
    return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void
{
    console.log("🔐 Setting auth token:", token);
    
    // HTTP için secure flag'i kaldır
    const isHttps = window.location.protocol === 'https:';
    const cookieString = isHttps 
        ? `accessToken=${token}; path=/; secure; samesite=lax` 
        : `accessToken=${token}; path=/; samesite=lax`;
    
    console.log("🍪 Setting cookie:", cookieString);
    document.cookie = cookieString;
    localStorage.setItem('authToken', token);
    
    // Hemen kontrol et
    console.log("🍪 Cookie after setting:", document.cookie);
    console.log("🔑 Token after setting:", getAuthToken());
}


export function removeAuthToken(): void
{
    console.log('🗑️ Removing all auth tokens and cookies');
    
    // Tüm auth cookie'lerini temizle
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'authStatus=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // localStorage'dan da temizle
    localStorage.removeItem('authToken');
    
    console.log('✅ All auth tokens cleared');
    console.log('🍪 Cookies after clearing:', document.cookie);
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
