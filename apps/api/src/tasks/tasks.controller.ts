import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '@auth-lib/lib/jwt-auth.guard';
import { RbacGuard } from '@auth-lib/lib/rbac.guard';
import { Permissions } from '@auth-lib/lib/permissions.decorator';
import { AuditService } from '../audit/audit.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TasksController {
  constructor(private tasks: TasksService, private audit: AuditService) {}

  @Get()
  @Permissions('task:read')
  async list(@Req() req) {
    const data = await this.tasks.listForUser(req.user);
    this.audit.log(`user:${req.user.email} action:LIST count:${data.length}`);
    return data;
  }

  @Post()
  @Permissions('task:create')
  async create(@Req() req, @Body() body) {
    const t = await this.tasks.create(req.user, body);
    this.audit.log(`user:${req.user.email} action:CREATE task:${t.id}`);
    return t;
  }

  @Put(':id')
  @Permissions('task:update')
  async update(@Req() req, @Param('id') id: string, @Body() body) {
    const t = await this.tasks.update(req.user, parseInt(id, 10), body);
    this.audit.log(`user:${req.user.email} action:UPDATE task:${id}`);
    return t;
  }

  @Delete(':id')
  @Permissions('task:delete')
  async del(@Req() req, @Param('id') id: string) {
    const res = await this.tasks.remove(req.user, parseInt(id, 10));
    this.audit.log(`user:${req.user.email} action:DELETE task:${id}`);
    return res;
  }
}
