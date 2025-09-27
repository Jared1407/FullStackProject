import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { Role } from '@data/lib/enums';
import { OrgsService } from '../orgs/orgs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private orgs: OrgsService
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async seed() {
    // Create orgs and users
    const { root, child } = await this.orgs.seed();
    const salt = await bcrypt.genSalt(10);
    const users = [
      { email: 'owner@acme.com', role: Role.OWNER, orgId: root.id },
      { email: 'admin@acme.com', role: Role.ADMIN, orgId: root.id },
      { email: 'viewer@acme.com', role: Role.VIEWER, orgId: child.id },
    ];
    for (const u of users) {
      const exists = await this.findByEmail(u.email);
      if (!exists) {
        const user = this.repo.create({
          email: u.email,
          role: u.role,
          orgId: u.orgId,
          passwordHash: await bcrypt.hash('Password123!', salt),
        });
        await this.repo.save(user);
      }
    }
    return { ok: true };
  }
}
