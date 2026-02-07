export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          github_username: string | null;
          contact_info: string | null;
          notification_preferences: {
            comments: boolean;
            votes: boolean;
            collaborators: boolean;
            status_changes: boolean;
          };
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          github_username?: string | null;
          contact_info?: string | null;
          notification_preferences?: {
            comments: boolean;
            votes: boolean;
            collaborators: boolean;
            status_changes: boolean;
          };
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          github_username?: string | null;
          contact_info?: string | null;
          notification_preferences?: {
            comments: boolean;
            votes: boolean;
            collaborators: boolean;
            status_changes: boolean;
          };
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          title: string;
          description: string;
          author_id: string;
          status: "open" | "in_progress" | "completed" | "archived";
          tags: string[];
          github_url: string | null;
          upvotes: number;
          comment_count: number;
          collaborator_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          author_id: string;
          status?: "open" | "in_progress" | "completed" | "archived";
          tags?: string[];
          github_url?: string | null;
          upvotes?: number;
          comment_count?: number;
          collaborator_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          author_id?: string;
          status?: "open" | "in_progress" | "completed" | "archived";
          tags?: string[];
          github_url?: string | null;
          upvotes?: number;
          comment_count?: number;
          collaborator_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ideas_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          idea_id: string;
          author_id: string;
          parent_comment_id: string | null;
          content: string;
          type: "comment" | "suggestion" | "question";
          is_incorporated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          author_id: string;
          parent_comment_id?: string | null;
          content: string;
          type?: "comment" | "suggestion" | "question";
          is_incorporated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          author_id?: string;
          parent_comment_id?: string | null;
          content?: string;
          type?: "comment" | "suggestion" | "question";
          is_incorporated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
      collaborators: {
        Row: {
          id: string;
          idea_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collaborators_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collaborators_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          idea_id: string;
          user_id: string;
          type: "upvote" | "downvote";
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          user_id: string;
          type?: "upvote" | "downvote";
          created_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          user_id?: string;
          type?: "upvote" | "downvote";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      board_columns: {
        Row: {
          id: string;
          idea_id: string;
          title: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          title: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          title?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "board_columns_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
        ];
      };
      board_tasks: {
        Row: {
          id: string;
          idea_id: string;
          column_id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          column_id: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "board_tasks_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "board_tasks_column_id_fkey";
            columns: ["column_id"];
            isOneToOne: false;
            referencedRelation: "board_columns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "board_tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: "comment" | "vote" | "collaborator" | "user_deleted" | "status_change";
          idea_id: string | null;
          comment_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: "comment" | "vote" | "collaborator" | "user_deleted" | "status_change";
          idea_id?: string | null;
          comment_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string;
          type?: "comment" | "vote" | "collaborator" | "user_deleted" | "status_change";
          idea_id?: string | null;
          comment_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_delete_user: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      idea_status: "open" | "in_progress" | "completed" | "archived";
      comment_type: "comment" | "suggestion" | "question";
      vote_type: "upvote" | "downvote";
      notification_type: "comment" | "vote" | "collaborator" | "user_deleted" | "status_change";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
