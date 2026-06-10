import { Router } from 'express';
import { asyncHandler } from './asyncHandler';
import { ProductsController } from './controllers/ProductsController';
import { ReceivingController } from './controllers/ReceivingController';
import { MovementController } from './controllers/MovementController';
import { ShippingController } from './controllers/ShippingController';
import { StockController } from './controllers/StockController';
import { TraceabilityController } from './controllers/TraceabilityController';
import { AuthController } from './controllers/AuthController';
import { UsersController } from './controllers/UsersController';
import { LocationsController } from './controllers/LocationsController';
import { AuditController } from './controllers/AuditController';
import { UserRole } from '../../domain/enums/UserRole';
import { authenticationMiddleware, adminAuthorizationMiddleware, requireRoles } from '../container';

export const router = Router();

// --- Authentication (public route, the only one without authenticationMiddleware) ---
router.post('/login', asyncHandler(AuthController.login));

// All routes below require a valid Bearer token.
router.use(authenticationMiddleware);

// --- Products (write: stock leader + admin; read: any authenticated user) ---
router.post(
  '/products',
  requireRoles(UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(ProductsController.create),
);
router.get('/products', asyncHandler(ProductsController.list));
router.get('/products/:id', asyncHandler(ProductsController.get));
router.put(
  '/products/:id',
  requireRoles(UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(ProductsController.update),
);

// --- Receiving / putaway ---
router.post(
  '/receipts',
  requireRoles(UserRole.RECEIVING, UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(ReceivingController.receive),
);
router.post(
  '/putaways',
  requireRoles(UserRole.SHIPPING, UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(ReceivingController.store),
);

// --- Movements / transfers ---
router.post(
  '/transfers',
  requireRoles(UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(MovementController.transfer),
);

// --- Shipping / outbound (same rule as putaway) ---
router.post(
  '/shipments',
  requireRoles(UserRole.SHIPPING, UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(ShippingController.ship),
);

// --- Stock / balance ---
router.get('/stock', asyncHandler(StockController.listOverview));
router.get('/stock/:productId', asyncHandler(StockController.balanceByProduct));

// --- Traceability ---
router.get('/movements', asyncHandler(TraceabilityController.list));

// --- Users: read access for any authenticated user ---
router.get('/users', asyncHandler(UsersController.list));
router.get('/users/:id', asyncHandler(UsersController.get));

// --- Users: write access requires ADMIN role ---
router.post('/users', adminAuthorizationMiddleware, asyncHandler(UsersController.create));
router.put('/users/:id', adminAuthorizationMiddleware, asyncHandler(UsersController.update));
router.patch(
  '/users/:id/status',
  adminAuthorizationMiddleware,
  asyncHandler(UsersController.changeStatus),
);

// --- Audit (read-only, restricted to ADMIN) ---
router.get('/audit', adminAuthorizationMiddleware, asyncHandler(AuditController.list));

// --- Locations (write: stock leader + admin; read: any authenticated user) ---
router.post(
  '/locations',
  requireRoles(UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(LocationsController.create),
);
router.get('/locations', asyncHandler(LocationsController.list));
router.get('/locations/:id', asyncHandler(LocationsController.get));
router.put(
  '/locations/:id',
  requireRoles(UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(LocationsController.update),
);
router.patch(
  '/locations/:id/status',
  requireRoles(UserRole.STOCK_LEADER, UserRole.ADMIN),
  asyncHandler(LocationsController.changeStatus),
);
