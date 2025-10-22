import { Router } from 'express';
import {
  submitCreditApplication,
  getOrganizationApplications,
  getAllCreditApplications,
  reviewCreditApplication,
  getCreditApplicationById,
} from '../controllers/credit-application.controller';
import { authenticate, requireCompanyAdmin, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * Company Admin Routes
 */

/**
 * @route   POST /api/v1/credit-applications
 * @desc    Submit a new credit application
 * @access  Company Admin
 */
router.post('/', authenticate, requireCompanyAdmin, submitCreditApplication);

/**
 * @route   GET /api/v1/credit-applications
 * @desc    Get all credit applications for the organization
 * @access  Company Admin
 */
router.get('/', authenticate, requireCompanyAdmin, getOrganizationApplications);

/**
 * Super Admin Routes
 */

/**
 * @route   GET /api/v1/credit-applications/all
 * @desc    Get all credit applications across all organizations
 * @access  Super Admin
 */
router.get('/all', authenticate, requireSuperAdmin, getAllCreditApplications);

/**
 * @route   GET /api/v1/credit-applications/:applicationId/details
 * @desc    Get credit application by ID
 * @access  Super Admin
 */
router.get('/:applicationId/details', authenticate, requireSuperAdmin, getCreditApplicationById);

/**
 * @route   POST /api/v1/credit-applications/:applicationId/review
 * @desc    Review credit application (approve/reject)
 * @access  Super Admin
 */
router.post('/:applicationId/review', authenticate, requireSuperAdmin, reviewCreditApplication);

export default router;
