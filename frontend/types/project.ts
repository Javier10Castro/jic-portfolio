export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  prompt?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export type ProjectStatus = 'active' | 'archived' | 'draft' | 'completed';

export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  prompt?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}
