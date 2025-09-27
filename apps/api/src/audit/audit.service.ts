import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuditService {
  private logPath = process.env.LOG_PATH || './logs/audit.log';

  log(line: string) {
    const ts = new Date().toISOString();
    fs.appendFileSync(this.logPath, `[${ts}] ${line}\n`);
  }

  tail(limit = 200): string[] {
    if (!fs.existsSync(this.logPath)) return [];
    const data = fs.readFileSync(this.logPath, 'utf-8');
    const lines = data.trim().split(/\r?\n/);
    return lines.slice(-limit);
  }
}
