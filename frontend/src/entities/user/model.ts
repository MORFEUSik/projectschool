export enum Role {
	Student = 'student',
	Teacher = 'teacher',
	Admin = 'admin',
 }
 
 export interface User {
	id: number;
	username: string;
	email: string;
	password?: string;
	role: Role;
	points: number;
	created_at: string;
	updated_at: string;
 }