import { describe, it, expect } from 'vitest';
import { Location } from '../../src/domain/entities/Location';
import { DomainError } from '../../src/domain/errors/DomainError';

describe('Location (entity)', () => {
  it('create returns active === true', () => {
    const l = Location.create({ code: 'A-01-01', description: 'Prateleira A1' });
    expect(l.active).toBe(true);
    expect(l.code).toBe('A-01-01');
    expect(l.description).toBe('Prateleira A1');
  });

  it('create rejects a blank code', () => {
    expect(() => Location.create({ code: '   ' })).toThrow(DomainError);
  });

  it('optional description becomes null when absent', () => {
    const l = Location.create({ code: 'B-01' });
    expect(l.description).toBeNull();
  });

  it('update changes code and description', () => {
    const l = Location.create({ code: 'B-01', description: 'antiga' });
    l.update({ code: 'B-02', description: 'nova' });
    expect(l.code).toBe('B-02');
    expect(l.description).toBe('nova');
  });

  it('update rejects an empty code', () => {
    const l = Location.create({ code: 'B-01' });
    expect(() => l.update({ code: '   ' })).toThrow(DomainError);
  });

  it('activate and deactivate toggle the flag', () => {
    const l = Location.create({ code: 'B-01' });
    l.deactivate();
    expect(l.active).toBe(false);
    l.activate();
    expect(l.active).toBe(true);
  });
});
