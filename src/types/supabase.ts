export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					email: string;
					username: string | null;
					full_name: string | null;
					avatar_url: string | null;
					bio: string | null;
					department: string | null;
					course: string | null;
					year_level: string | null;
					interests: string[] | null;
					organizations: string[] | null;
					created_at: string;
					updated_at: string | null;
				};
				Insert: {
					id: string;
					email: string;
					username?: string | null;
					full_name?: string | null;
					avatar_url?: string | null;
					bio?: string | null;
					department?: string | null;
					course?: string | null;
					year_level?: string | null;
					interests?: string[] | null;
					organizations?: string[] | null;
					created_at?: string;
					updated_at?: string | null;
				};
				Update: {
					email?: string;
					username?: string | null;
					full_name?: string | null;
					avatar_url?: string | null;
					bio?: string | null;
					department?: string | null;
					course?: string | null;
					year_level?: string | null;
					interests?: string[] | null;
					organizations?: string[] | null;
					updated_at?: string | null;
				};
			};
			departments: {
				Row: {
					id: string;
					name: string;
					sort_order: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					sort_order?: number | null;
					created_at?: string;
				};
				Update: {
					name?: string;
					sort_order?: number | null;
				};
			};
			courses: {
				Row: {
					id: string;
					department_id: string | null;
					name: string;
					sort_order: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					department_id?: string | null;
					name: string;
					sort_order?: number | null;
					created_at?: string;
				};
				Update: {
					department_id?: string | null;
					name?: string;
					sort_order?: number | null;
				};
			};
			organizations: {
				Row: {
					id: string;
					name: string;
					sort_order: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					sort_order?: number | null;
					created_at?: string;
				};
				Update: {
					name?: string;
					sort_order?: number | null;
				};
			};
			interests: {
				Row: {
					id: string;
					name: string;
					category: string;
					color: string;
					sort_order: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					category: string;
					color: string;
					sort_order?: number | null;
					created_at?: string;
				};
				Update: {
					name?: string;
					category?: string;
					color?: string;
					sort_order?: number | null;
				};
			};
			conversations: {
				Row: {
					id: string;
					created_at: string;
					updated_at: string | null;
				};
				Insert: {
					id?: string;
					created_at?: string;
					updated_at?: string | null;
				};
				Update: {
					updated_at?: string | null;
				};
			};
			conversation_members: {
				Row: {
					conversation_id: string;
					user_id: string;
					last_read_at: string | null;
					created_at: string;
				};
				Insert: {
					conversation_id: string;
					user_id: string;
					last_read_at?: string | null;
					created_at?: string;
				};
				Update: {
					last_read_at?: string | null;
				};
			};
			messages: {
				Row: {
					id: string;
					conversation_id: string;
					sender_id: string;
					content: string | null;
					image_url: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					conversation_id: string;
					sender_id: string;
					content?: string | null;
					image_url?: string | null;
					created_at?: string;
				};
				Update: {
					content?: string | null;
					image_url?: string | null;
				};
			};
			notifications: {
				Row: {
					id: string;
					user_id: string;
					type: string;
					title: string;
					description: string | null;
					from_user_id: string | null;
					is_read: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					type: string;
					title: string;
					description?: string | null;
					from_user_id?: string | null;
					is_read?: boolean;
					created_at?: string;
				};
				Update: {
					type?: string;
					title?: string;
					description?: string | null;
					from_user_id?: string | null;
					is_read?: boolean;
				};
			};
			user_interactions: {
				Row: {
					id: string;
					user_id: string;
					target_user_id: string;
					status: string;
					accepted_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					target_user_id: string;
					status: string;
					accepted_at?: string | null;
					created_at?: string;
				};
				Update: {
					status?: string;
					accepted_at?: string | null;
				};
			};
		};
		Views: Record<string, never>;
		Functions: {
			get_or_create_conversation: {
				Args: {
					target_user_id: string;
				};
				Returns: string;
			};
			get_shared_conversation: {
				Args: {
					user_id_1: string;
					user_id_2: string;
				};
				Returns: string;
			};
		};
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
}
