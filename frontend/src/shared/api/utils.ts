// src/shared/api/utils.ts
export async function handleApiError(response: Response): Promise<never> {
	let errorMessage = 'Неизвестная ошибка';
	try {
	  const error = await response.json();
	  errorMessage = error.error || `Ошибка: ${response.status}`;
	} catch {
	  errorMessage = `Ошибка: ${response.status}`;
	}
	throw new Error(errorMessage);
 }