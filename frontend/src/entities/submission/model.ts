export interface Assignment {
	id: number;
	title: string;
	course_id: number;
 }
 
 export interface Submission {
	id: number;
	assignment_id: number;
	content: string;
	grade: number | null;
	created_at: string;
	assignment: Assignment;
 }