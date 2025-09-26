import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '@auth-lib/lib/jwt-auth.guard';
import { RbacGuard } from '@auth-lib/lib/rbac.guard';
import { Permissions } from '@auth-lib/lib/permissions.decorator';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  @Permissions('audit:read')
  get(@Query('limit') limit = '200') {
    return { lines: this.audit.tail(parseInt(limit, 10)) };
  }
}
