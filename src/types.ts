// Types for the App Management system

export interface AppLink {
  label: string;
  url: string;
}

export interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;          // emoji or URL
  url: string;           // primary link
  links: AppLink[] | string;  // secondary links (stored as JSON string in Sheet)
  access_role: string;   // admin/all/finance/hr/marketing/...
  status: "active" | "inactive";
  order: number;
  created_at: string;
  updated_at: string;
  version: number;
  deleted: boolean | string;
}

export type AppCategory = {
  name: string;
  apps: App[];
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  department: string;
  avatar: string;
  active: boolean | string;
  version: number;
  deleted: boolean | string;
  created_at: string;
  updated_at: string;
}

// Parsed app with links as array
export interface ParsedApp extends Omit<App, "links"> {
  links: AppLink[];
}
