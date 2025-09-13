export type Role = "client" | "doctor" | "admin";

export interface Profile {
  id: string;
  role: Role;
  onboarded: boolean;
  created_at: string;
}


