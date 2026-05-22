import { randomUUID } from 'node:crypto';
import { optionalText, requiredText } from '../validation';

/** Storage location inside the warehouse (e.g. "A-01-02", "DOCK"). */
export class Location {
  constructor(
    public readonly id: string,
    public code: string,
    public description: string | null,
  ) {}

  static create(props: { code: unknown; description?: unknown }): Location {
    return new Location(
      randomUUID(),
      requiredText(props.code, 'Location code'),
      optionalText(props.description),
    );
  }
}
