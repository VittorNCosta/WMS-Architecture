import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Project "database": a single JSON file.
 *
 * It is not a DBMS — just simple file persistence, enough for an architecture
 * project. Keeps the state in memory and rewrites the whole file on every
 * change (`save()`).
 *
 * Each array below is a "table". Rows are plain objects (no methods); the
 * row <-> domain-entity conversion is done by the repositories.
 */

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  active: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface LocationRow {
  id: string;
  code: string;
  description: string | null;
  active: boolean;
}

export interface StockItemRow {
  id: string;
  productId: string;
  locationId: string | null;
  quantity: number;
  entryDate: string; // ISO 8601 — FIFO basis
}

export interface MovementRow {
  id: string;
  type: string; // MovementType
  productId: string;
  quantity: number;
  sourceLocationId: string | null;
  destinationLocationId: string | null;
  userId: string;
  referenceDocument: string | null;
  timestamp: string; // ISO 8601
}

export interface UserRow {
  id: string;
  name: string;
  login: string;
  role: string; // UserRole
  active: boolean;
  passwordHash: string;
}

export interface AuditTrailRow {
  id: string;
  occurredAt: string; // ISO 8601
  actorUserId: string;
  actorLogin: string;
  operation: string; // AuditOperation
  entityType: string;
  entityId: string;
  summary: string;
}

export interface DatabaseData {
  products: ProductRow[];
  locations: LocationRow[];
  stock: StockItemRow[];
  movements: MovementRow[];
  users: UserRow[];
  audit: AuditTrailRow[];
}

function emptyDatabase(): DatabaseData {
  return {
    products: [],
    locations: [],
    stock: [],
    movements: [],
    users: [],
    audit: [],
  };
}

export class JsonDatabase {
  private readonly data: DatabaseData;

  constructor(private readonly filePath: string) {
    this.data = this.load();
  }

  private load(): DatabaseData {
    if (!existsSync(this.filePath)) return emptyDatabase();
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf-8')) as Partial<DatabaseData>;
      return { ...emptyDatabase(), ...raw };
    } catch {
      // non-existent/corrupted file -> start from scratch
      return emptyDatabase();
    }
  }

  /** Returns the requested "table". After changing it, call `save()`. */
  table<K extends keyof DatabaseData>(name: K): DatabaseData[K] {
    return this.data[name];
  }

  /** Writes the whole current state to the JSON file. */
  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2) + '\n', 'utf-8');
  }
}
