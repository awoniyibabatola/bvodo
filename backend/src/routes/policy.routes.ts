import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getMyPolicy,
  checkPolicyCompliance,
  createException,
  getExceptions,
  getUsageLogs,
} from '../controllers/policy.controller';

const router = Router();

// All policy routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/policies/my-policy
 * @desc    Get the effective policy for the current user
 * @access  Private (All authenticated users)
 */
router.get('/my-policy', getMyPolicy);

/**
 * @route   POST /api/policies/check
 * @desc    Check if a booking complies with user's policy
 * @access  Private (All authenticated users)
 */
router.post('/check', checkPolicyCompliance);

/**
 * @route   GET /api/policies/usage-logs
 * @desc    Get policy usage logs
 * @access  Private (Admin, Company Admin)
 */
router.get('/usage-logs', getUsageLogs);

/**
 * @route   GET /api/policies
 * @desc    Get all policies for the organization
 * @access  Private (Admin, Company Admin)
 */
router.get('/', getPolicies);

/**
 * @route   GET /api/policies/:id
 * @desc    Get a single policy by ID
 * @access  Private (Admin, Company Admin)
 */
router.get('/:id', getPolicyById);

/**
 * @route   POST /api/policies
 * @desc    Create a new booking policy
 * @access  Private (Admin, Company Admin)
 */
router.post('/', createPolicy);

/**
 * @route   PUT /api/policies/:id
 * @desc    Update a booking policy
 * @access  Private (Admin, Company Admin)
 */
router.put('/:id', updatePolicy);

/**
 * @route   DELETE /api/policies/:id
 * @desc    Delete a booking policy (soft delete)
 * @access  Private (Admin, Company Admin)
 */
router.delete('/:id', deletePolicy);

/**
 * @route   POST /api/policies/:id/exceptions
 * @desc    Create a policy exception
 * @access  Private (Manager, Admin, Company Admin)
 */
router.post('/:id/exceptions', createException);

/**
 * @route   GET /api/policies/:id/exceptions
 * @desc    Get all exceptions for a policy
 * @access  Private (Admin, Company Admin)
 */
router.get('/:id/exceptions', getExceptions);

export default router;
