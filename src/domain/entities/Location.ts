import { randomUUID } from 'node:crypto';
import { requiredText, optionalText } from '../validation';

/** Storage address inside the warehouse (e.g. "A-01-02", "DOCK"). */
export class Location {
  constructor(
    public readonly id: string,
    public code: string,
    public description: string | null,
    public active: boolean,
  ) {}

  static create(props: { code: unknown; description?: unknown }): Location {
    return new Location(
      randomUUID(),
      requiredText(props.code, 'Código da localização'),
      optionalText(props.description),
      true,
    );
  }

  update(data: { code?: unknown; description?: unknown }): void {
    if (data.code !== undefined) {
      this.code = requiredText(data.code, 'Código da localização');
    }
    if (data.description !== undefined) {
      this.description = optionalText(data.description);
    }
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }
}
