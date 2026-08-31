// Database row types
export type Role = "user" | "admin";

export interface UserRow {
  id: number;
  github_id: string;
  github_login: string;
  display_name: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface AccessTokenRow {
  id: number;
  user_id: number;
  label: string;
  token_hash: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

export interface ConfigRow {
  key: string;
  value: unknown;
  updated_at: string;
}
