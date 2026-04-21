export interface CreateIssueRequest {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_type?: string;
  assignee_id?: string;
  parent_issue_id?: string;
  project_id?: string;
  due_date?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_type?: string | null;
  assignee_id?: string | null;
  project_id?: string | null;
  due_date?: string | null;
  position?: number;
}

export interface ListIssuesParams {
  status?: string[];
  priority?: string[];
  assignee_type?: string;
  assignee_id?: string[];
  creator_id?: string[];
  project_id?: string[];
  search?: string;
  parent_issue_id?: string;
  limit?: number;
  offset?: number;
}

export interface ListIssuesResponse {
  issues: import("./issue").Issue[];
  total: number;
  doneTotal: number;
}

export interface SearchIssueResult {
  id: string;
  title: string;
  identifier: string;
  status: string;
  priority: string;
  match_source: string;
  matched_snippet: string;
}

export interface SearchIssuesResponse {
  issues: SearchIssueResult[];
}

export interface SearchProjectResult {
  id: string;
  title: string;
  status: string;
  match_source: string;
  matched_snippet: string;
}

export interface SearchProjectsResponse {
  projects: SearchProjectResult[];
}

export interface UpdateMeRequest {
  name?: string;
  avatar_url?: string;
}

export interface CreateMemberRequest {
  email: string;
  role?: string;
}

export interface UpdateMemberRequest {
  role: string;
}

export interface PersonalAccessToken {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  created_at: string;
}

export interface CreatePersonalAccessTokenRequest {
  name: string;
}

export interface CreatePersonalAccessTokenResponse {
  id: string;
  token: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
