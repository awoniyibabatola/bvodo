import { Router } from 'express';
import {
  inviteUser,
  allocateCredit,
  reduceCredit,
  removeUser,
  getAllUsers,
  getAllTrips,
  getOrganizationStats,
  updateUser,
} from '../controllers/company-admin.controller';
import { authenticate, requireCompanyAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and company admin role
router.use(authenticate, requireCompanyAdmin);

/**
 * @route   GET /api/v1/company-admin/stats
 * @desc    Get organization statistics
 * @access  Company Admin, Admin
 */
router.get('/stats', getOrganizationStats);

/**
 * @route   GET /api/v1/company-admin/users
 * @desc    Get all users in the organization
 * @access  Company Admin, Admin
 * @query   status, role
 */
router.get('/users', getAllUsers);

/**
 * @route   POST /api/v1/company-admin/users/invite
 * @desc    Invite a new user to the organization
 * @access  Company Admin, Admin
 */
router.post('/users/invite', inviteUser);

/**
 * @route   PUT /api/v1/company-admin/users/:userId
 * @desc    Update user details
 * @access  Company Admin, Admin
 */
router.put('/users/:userId', updateUser);

/**
 * @route   DELETE /api/v1/company-admin/users/:userId
 * @desc    Remove or deactivate a user
 * @access  Company Admin, Admin
 * @query   permanent=true for hard delete
 */
router.delete('/users/:userId', removeUser);

/**
 * @route   POST /api/v1/company-admin/users/:userId/credit/allocate
 * @desc    Allocate or update credit for a user
 * @access  Company Admin, Admin
 */
router.post('/users/:userId/credit/allocate', allocateCredit);

/**
 * @route   POST /api/v1/company-admin/users/:userId/credit/reduce
 * @desc    Reduce user's credit balance
 * @access  Company Admin, Admin
 */
router.post('/users/:userId/credit/reduce', reduceCredit);

/**
 * @route   GET /api/v1/company-admin/trips
 * @desc    Get all bookings/trips in the organization
 * @access  Company Admin, Admin
 * @query   status, bookingType, userId, startDate, endDate
 */
router.get('/trips', getAllTrips);

export default router;
