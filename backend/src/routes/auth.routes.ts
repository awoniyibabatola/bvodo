import { Router } from 'express';
import { register, login, getProfile, acceptInvitation, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user and organization
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/v1/auth/accept-invitation
 * @desc    Accept invitation and complete user registration
 * @access  Public
 */
router.post('/accept-invitation', acceptInvitation);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

export default router;
