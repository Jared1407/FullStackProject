import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/org.entity';

@Injectable()
export class OrgsService {
  constructor(@InjectRepository(Organization) private repo: Repository<Organization>) {}

  async seed() {
    let root = await this.repo.findOne({ where: { name: 'Acme Root' } });
    if (!root) {
      root = this.repo.create({ name: 'Acme Root', parentOrgId: null });
      await this.repo.save(root);
    }
    let child = await this.repo.findOne({ where: { name: 'Acme Sub' } });
    if (!child) {
      child = this.repo.create({ name: 'Acme Sub', parentOrgId: root.id });
      await this.repo.save(child);
    }
    return { root, child };
  }

  async orgParentMap(): Promise<Record<number, number | null>> {
    const all = await this.repo.find();
    const map: Record<number, number | null> = {};
    for (const o of all) map[o.id] = o.parentOrgId ?? null;
    return map;
  }
}
