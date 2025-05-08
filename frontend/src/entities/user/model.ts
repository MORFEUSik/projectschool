// src/entities/user/model.ts
export interface User {
	id: number;
	username: string;
	email: string;
	role: 'student' | 'teacher' | 'admin';
	class_number?: number;
	points: number;
	created_at: string;
	updated_at: string;
 }