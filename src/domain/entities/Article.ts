import { randomUUID } from 'node:crypto';
import { optionalText, requiredText } from '../validation';

/** Article (product / SKU) handled by the warehouse — create / update / read. */
export class Article {
  constructor(
    public readonly id: string,
    public sku: string,
    public name: string,
    public description: string | null,
    public unitOfMeasure: string,
    public active: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: {
    sku: unknown;
    name: unknown;
    description?: unknown;
    unitOfMeasure: unknown;
  }): Article {
    const now = new Date();
    return new Article(
      randomUUID(),
      requiredText(props.sku, 'Article SKU'),
      requiredText(props.name, 'Article name'),
      optionalText(props.description),
      requiredText(props.unitOfMeasure, 'Unit of measure'),
      true,
      now,
      now,
    );
  }

  update(data: {
    name?: unknown;
    description?: unknown;
    unitOfMeasure?: unknown;
    active?: unknown;
  }): void {
    if (data.name !== undefined) this.name = requiredText(data.name, 'Article name');
    if (data.description !== undefined) this.description = optionalText(data.description);
    if (data.unitOfMeasure !== undefined) {
      this.unitOfMeasure = requiredText(data.unitOfMeasure, 'Unit of measure');
    }
    if (typeof data.active === 'boolean') this.active = data.active;
    this.updatedAt = new Date();
  }
}
