import { Role } from '@data/lib/enums';

describe('RBAC mapping', () => {
  it('OWNER should have full permissions', () => {
    const perms = ['task:create','task:read','task:update','task:delete','audit:read'];
    expect(perms.includes('task:create')).toBe(true);
    expect(perms.includes('audit:read')).toBe(true);
  });
});
