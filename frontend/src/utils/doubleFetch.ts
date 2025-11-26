import { API_BASE_URL } from '../index.js';
import { getAuthHeaders } from './auth.js';

export default async function doubleFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
	const res1 = await fetch(`${API_BASE_URL}/auth/health`, {
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders()
		}
	});

	const res2 = await fetch(input, init);
	return res2;
}
