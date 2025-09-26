import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TaskStatus, Role } from '@data/lib/enums';
import { OrgsService } from '../orgs/orgs.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    private orgs: OrgsService,
  ) {}

  async listForUser(user: any) {
    // OWNER: all tasks in org + child
    // ADMIN: org + child
    // VIEWER: org only (read-only)
    const orgMap = await this.orgs.orgParentMap();
    const all = await this.repo.find();
    return all.filter(t => {
      if (user.role === Role.OWNER || user.role === Role.ADMIN) {
        // same org or its child
        return t.orgId === user.orgId || orgMap[t.orgId] === user.orgId;
      }
      // VIEWER: same org only
      return t.orgId === user.orgId;
    });
  }

  async getByIdForUser(user: any, id: number) {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) return null;
    const orgMap = await this.orgs.orgParentMap();
    const canSee = (user.role === Role.OWNER || user.role === Role.ADMIN)
      ? (task.orgId === user.orgId || orgMap[task.orgId] === user.orgId)
      : (task.orgId === user.orgId);
    if (!canSee) throw new ForbiddenException('Not allowed to view');
    return task;
  }

  async create(user: any, dto: any) {
    const t = this.repo.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      status: dto.status || TaskStatus.TODO,
      ownerId: user.sub,
      orgId: user.orgId,
    });
    return this.repo.save(t);
  }

  async update(user: any, id: number, dto: any) {
    const t = await this.getByIdForUser(user, id);
    if (!t) return null;
    if (user.role === Role.VIEWER && t.ownerId !== user.sub) {
      throw new ForbiddenException('VIEWER cannot update others tasks');
    }
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async remove(user: any, id: number) {
    const t = await this.getByIdForUser(user, id);
    if (!t) return null;
    if (user.role === Role.VIEWER) throw new ForbiddenException('VIEWER cannot delete');
    await this.repo.remove(t);
    return { ok: true };
  }
}
