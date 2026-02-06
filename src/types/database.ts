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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      idea_status: "open" | "in_progress" | "completed" | "archived";
      comment_type: "comment" | "suggestion" | "question";
      vote_type: "upvote" | "downvote";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
