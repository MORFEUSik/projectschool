export async function fetchWithAuth(url: string, options: RequestInit = {}) {
	const token = localStorage.getItem('token');
	const headers = {
	  ...options.headers,
	  ...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
 
	return fetch(`http://localhost:8080${url}`, {
	  ...options,
	  headers,
	});
 }