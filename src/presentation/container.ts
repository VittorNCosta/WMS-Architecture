/**
 * Composition Root.
 *
 * It is the only place that knows all layers: opens the "database" (JSON file),
 * instantiates the concrete repositories (Infra) and injects those abstractions
 * into the use cases (Application). It is the concrete application of the
 * Dependency Injection pattern — to switch databases, just change what is
 * instantiated here.
 */
import { resolve } from 'node:path';

import { Location } from '../domain/entities/Location';
import { User } from '../domain/entities/User';
import { UserRole } from '../domain/enums/UserRole';

import { JsonDatabase } from '../infrastructure/persistence/JsonDatabase';
import { JsonFileAuditTrailRepository } from '../infrastructure/repositories/JsonFileAuditTrailRepository';
import { JsonFileStockRepository } from '../infrastructure/repositories/JsonFileStockRepository';
import { JsonFileLocationRepository } from '../infrastructure/repositories/JsonFileLocationRepository';
import { JsonFileMovementRepository } from '../infrastructure/repositories/JsonFileMovementRepository';
import { JsonFileProductRepository } from '../infrastructure/repositories/JsonFileProductRepository';
import { JsonFileUserRepository } from '../infrastructure/repositories/JsonFileUserRepository';
import { BcryptHasher } from '../infrastructure/security/BcryptHasher';
import { InMemorySessionStore } from '../infrastructure/security/InMemorySessionStore';

import { CreateProduct } from '../application/use-cases/products/CreateProduct';
import { UpdateProduct } from '../application/use-cases/products/UpdateProduct';
import { GetProduct } from '../application/use-cases/products/GetProduct';
import { ProcessInbound } from '../application/use-cases/receiving/ProcessInbound';
import { StoreItem } from '../application/use-cases/receiving/StoreItem';
import { TransferStock } from '../application/use-cases/movement/TransferStock';
import { ProcessOutbound } from '../application/use-cases/shipping/ProcessOutbound';
import { TraceMovements } from '../application/use-cases/traceability/TraceMovements';
import { GetBalance } from '../application/use-cases/stock/GetBalance';
import { GetStockOverview } from '../application/use-cases/stock/GetStockOverview';
import { StockOverviewConsolidator } from '../application/use-cases/stock/StockOverviewConsolidator';
import { AuthenticateUser } from '../application/use-cases/authentication/AuthenticateUser';
import { CreateUser } from '../application/use-cases/users/CreateUser';
import { UpdateUser } from '../application/use-cases/users/UpdateUser';
import { ChangeUserStatus } from '../application/use-cases/users/ChangeUserStatus';
import { GetUser } from '../application/use-cases/users/GetUser';
import { CreateLocation } from '../application/use-cases/locations/CreateLocation';
import { UpdateLocation } from '../application/use-cases/locations/UpdateLocation';
import { ChangeLocationStatus } from '../application/use-cases/locations/ChangeLocationStatus';
import { GetLocation } from '../application/use-cases/locations/GetLocation';
import { ListAuditTrail } from '../application/use-cases/audit/ListAuditTrail';

import { buildAuthenticationMiddleware } from './http/middlewares/authenticationMiddleware';
import { adminAuthorizationMiddleware } from './http/middlewares/adminAuthorizationMiddleware';
import { requireRoles } from './http/middlewares/requireRoles';

// --- "Database" (JSON file) ---
// Can be overridden by the WMS_DB environment variable.
const DB_FILE = process.env.WMS_DB ?? resolve(process.cwd(), 'data', 'wms-db.json');
const db = new JsonDatabase(DB_FILE);

// --- Infrastructure (repositories + security) ---
const productRepo = new JsonFileProductRepository(db);
const locationRepo = new JsonFileLocationRepository(db);
const stockRepo = new JsonFileStockRepository(db);
const movementRepo = new JsonFileMovementRepository(db);
const userRepo = new JsonFileUserRepository(db);
const auditRepo = new JsonFileAuditTrailRepository(db);

const hasher = new BcryptHasher();
const sessionStore = new InMemorySessionStore();

export const repositories = {
  productRepo,
  locationRepo,
  stockRepo,
  movementRepo,
  userRepo,
  auditRepo,
};

// --- Use cases (receive the abstractions via dependency injection) ---
export const useCases = {
  createProduct: new CreateProduct(productRepo, auditRepo),
  updateProduct: new UpdateProduct(productRepo, auditRepo),
  getProduct: new GetProduct(productRepo),
  processInbound: new ProcessInbound(stockRepo, movementRepo, productRepo, userRepo, locationRepo, auditRepo),
  storeItem: new StoreItem(stockRepo, movementRepo, locationRepo, userRepo, productRepo, auditRepo),
  transferStock: new TransferStock(stockRepo, movementRepo, productRepo, locationRepo, userRepo, auditRepo),
  processOutbound: new ProcessOutbound(stockRepo, movementRepo, productRepo, userRepo, auditRepo),
  traceMovements: new TraceMovements(movementRepo),
  getBalance: new GetBalance(stockRepo),
  getStockOverview: new GetStockOverview(stockRepo, productRepo, locationRepo, new StockOverviewConsolidator()),
  authenticateUser: new AuthenticateUser(userRepo, hasher, sessionStore, auditRepo),
  createUser: new CreateUser(userRepo, hasher, auditRepo),
  updateUser: new UpdateUser(userRepo, hasher, auditRepo),
  changeUserStatus: new ChangeUserStatus(userRepo, auditRepo),
  getUser: new GetUser(userRepo),
  createLocation: new CreateLocation(locationRepo, auditRepo),
  updateLocation: new UpdateLocation(locationRepo, auditRepo),
  changeLocationStatus: new ChangeLocationStatus(locationRepo, stockRepo, auditRepo),
  getLocation: new GetLocation(locationRepo),
  listAuditTrail: new ListAuditTrail(auditRepo),
};

// --- Security middlewares exposed to the HTTP pipeline ---
export const authenticationMiddleware = buildAuthenticationMiddleware(sessionStore, userRepo);
export { adminAuthorizationMiddleware };
export { requireRoles };

export const dbPath = DB_FILE;

export interface ItemSeed {
  type: 'user' | 'location';
  identifier: string;
  id: string;
}

/**
 * Loads sample users and locations — only on the first run (when the JSON file
 * is still empty). It is idempotent: running it again does not duplicate
 * anything.
 */
export async function seed(): Promise<ItemSeed[]> {
  if ((await userRepo.listAll()).length === 0) {
    const defaultPasswordHash = await hasher.hash('wyms14623');
    await userRepo.save(
      User.create({
        name: 'Administrador',
        login: 'admin',
        role: UserRole.ADMIN,
        passwordHash: defaultPasswordHash,
      }),
    );
    await userRepo.save(
      User.create({
        name: 'Líder de Estoque',
        login: 'lider',
        role: UserRole.STOCK_LEADER,
        passwordHash: defaultPasswordHash,
      }),
    );
  }

  if ((await locationRepo.listAll()).length === 0) {
    await locationRepo.save(Location.create({ code: 'DOCA', description: 'Doca de recebimento' }));
    await locationRepo.save(Location.create({ code: 'A-01-01', description: 'Rua A, prateleira 01, posição 01' }));
    await locationRepo.save(Location.create({ code: 'A-01-02', description: 'Rua A, prateleira 01, posição 02' }));
  }

  const users = await userRepo.listAll();
  const locations = await locationRepo.listAll();
  return [
    ...users.map((u) => ({ type: 'user' as const, identifier: u.login, id: u.id })),
    ...locations.map((l) => ({ type: 'location' as const, identifier: l.code, id: l.id })),
  ];
}
