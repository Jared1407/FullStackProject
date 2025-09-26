import { Role, TaskStatus } from './enums';

export interface JwtPayload {
  sub: number;
  email: string;
  orgId: number;
  role: Role;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
}
