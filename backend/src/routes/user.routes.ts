import { Router } from 'express';
import { updateProfile, updateAvatar, changePassword } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   PUT /api/v1/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PUT /api/v1/user/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.put('/avatar', authenticate, updateAvatar);

/**
 * @route   PUT /api/v1/user/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', authenticate, changePassword);

export default router;
