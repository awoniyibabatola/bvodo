import { Router } from 'express';
import {
  getAllOrganizations,
  getOrganizationById,
  allocateCredits,
  reduceCredits,
  getSuperAdminStats,
  updateOrganization,
  deleteOrganization,
  resetOrganizationCredits,
  deleteOrganizationBookings,
  resetPlatform,
} from '../controllers/super-admin.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require super admin authentication
router.use(authenticate, requireSuperAdmin);

/**
 * @route   GET /api/v1/super-admin/stats
 * @desc    Get super admin dashboard statistics
 * @access  Super Admin Only
 */
router.get('/stats', getSuperAdminStats);

/**
 * @route   GET /api/v1/super-admin/organizations
 * @desc    Get all organizations with pagination and search
 * @access  Super Admin Only
 */
router.get('/organizations', getAllOrganizations);

/**
 * @route   GET /api/v1/super-admin/organizations/:organizationId
 * @desc    Get a single organization with detailed stats
 * @access  Super Admin Only
 */
router.get('/organizations/:organizationId', getOrganizationById);

/**
 * @route   PUT /api/v1/super-admin/organizations/:organizationId
 * @desc    Update organization details
 * @access  Super Admin Only
 */
router.put('/organizations/:organizationId', updateOrganization);

/**
 * @route   DELETE /api/v1/super-admin/organizations/:organizationId
 * @desc    Delete organization (soft delete)
 * @access  Super Admin Only
 */
router.delete('/organizations/:organizationId', deleteOrganization);

/**
 * @route   POST /api/v1/super-admin/organizations/:organizationId/credits/allocate
 * @desc    Allocate credits to an organization
 * @access  Super Admin Only
 */
router.post('/organizations/:organizationId/credits/allocate', allocateCredits);

/**
 * @route   POST /api/v1/super-admin/organizations/:organizationId/credits/reduce
 * @desc    Reduce credits from an organization
 * @access  Super Admin Only
 */
router.post('/organizations/:organizationId/credits/reduce', reduceCredits);

/**
 * @route   POST /api/v1/super-admin/organizations/:organizationId/credits/reset
 * @desc    Reset all credits for an organization to 0
 * @access  Super Admin Only
 */
router.post('/organizations/:organizationId/credits/reset', resetOrganizationCredits);

/**
 * @route   DELETE /api/v1/super-admin/organizations/:organizationId/bookings
 * @desc    Delete all bookings for an organization
 * @access  Super Admin Only
 */
router.delete('/organizations/:organizationId/bookings', deleteOrganizationBookings);

/**
 * @route   POST /api/v1/super-admin/reset-platform
 * @desc    Reset entire platform (all credits and bookings) - DANGER!
 * @access  Super Admin Only
 */
router.post('/reset-platform', resetPlatform);

export default router;
