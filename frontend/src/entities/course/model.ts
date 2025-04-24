export interface User {
	id: number;
	username: string;
 }
 
 export interface Enrollment {
	user_id: number;
	course_id: number;
 }
 
 export interface Course {
	id: number;
	title: string;
	description: string;
	teacher: User;
	enrollments: Enrollment[];
	created_at: string;
	updated_at: string;
 }