import { Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from '../utils/auth.utils';
import { logger } from '../utils/logger';
import { sendAccountCreatedEmail } from '../utils/email.service';

/**
 * Register a new user and organization
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { organizationName, fullName, email, password } = req.body;

    // Validate required fields
    if (!organizationName || !fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Split full name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

    // Generate subdomain from organization name
    const subdomain = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    // Check if subdomain already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { subdomain },
    });

    if (existingOrg) {
      // Add random suffix if subdomain exists
      const randomSuffix = Math.floor(Math.random() * 1000);
      const newSubdomain = `${subdomain}-${randomSuffix}`;

      // Create organization and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            subdomain: newSubdomain,
            email,
            totalCredits: 0,
            availableCredits: 0,
          },
        });

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user as admin
        const user = await tx.user.create({
          data: {
            organizationId: organization.id,
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'admin',
            status: 'active',
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });

        return { organization, user };
      });

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id,
        role: result.user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id,
        role: result.user.role,
      });

      logger.info(`New user registered: ${email}`);

      // Send welcome email
      await sendAccountCreatedEmail(
        email,
        result.user.firstName,
        result.organization.name,
        result.organization.subdomain
      );

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
          },
          organization: {
            id: result.organization.id,
            name: result.organization.name,
            subdomain: result.organization.subdomain,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    }

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          subdomain,
          email,
          totalCredits: 0,
          availableCredits: 0,
        },
      });

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user as admin
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'admin',
          status: 'active',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      return { organization, user };
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: result.user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: result.user.role,
    });

    logger.info(`New user registered: ${email}`);

    // Send welcome email
    await sendAccountCreatedEmail(
      email,
      result.user.firstName,
      result.organization.name,
      result.organization.subdomain
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          subdomain: result.organization.subdomain,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact support.',
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Account temporarily locked. Please try again later.',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });

    logger.info(`User logged in: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          subdomain: user.organization.subdomain,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    // User ID will be added by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          department: user.department,
          availableCredits: user.availableCredits.toString(),
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          subdomain: user.organization.subdomain,
          availableCredits: user.organization.availableCredits.toString(),
        },
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // For now, we don't need to do anything server-side
    // JWT tokens are stateless, so logout is handled client-side
    // In production, you might want to implement token blacklisting

    logger.info('User logged out');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

/**
 * Accept invitation and complete user registration
 */
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    // Validate required fields
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Find user by invitation token
    const user = await prisma.user.findFirst({
      where: {
        invitationToken: token,
        status: 'pending',
      },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token',
      });
    }

    // Check if invitation is still valid (optional: add expiration check)
    // Example: Check if invitation was sent more than 7 days ago
    if (user.invitationSentAt) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (user.invitationSentAt < sevenDaysAgo) {
        return res.status(400).json({
          success: false,
          message: 'Invitation has expired. Please request a new invitation.',
        });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'active',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        invitationToken: null,
        invitationAcceptedAt: new Date(),
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      organizationId: updatedUser.organizationId,
      role: updatedUser.role,
    });

    const refreshToken = generateRefreshToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      organizationId: updatedUser.organizationId,
      role: updatedUser.role,
    });

    logger.info(`User accepted invitation: ${updatedUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          subdomain: user.organization.subdomain,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error('Accept invitation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
    });
  }
};
