// src/entities/course/model.ts
export interface Course {
	id: number;
	title: string;
	description: string;
	teacher: {
	  id: number;
	  username: string;
	};
	created_at: string;
	updated_at: string;
 }