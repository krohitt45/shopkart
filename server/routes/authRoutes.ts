import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { AuthRequest, generateToken, requireAuth } from '../middleware/auth.ts';

const router = Router();

// Register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = db.users.findByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = db.users.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      password: hashedPassword,
      role: 'customer',
      addresses: [],
    });

    const token = generateToken(newUser);

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, message: 'This account has been deactivated. Contact support.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password || '');
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Login failed: ' + err.message });
  }
});

// Current User Profile
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const { password: _, ...userSafe } = req.user!;
  res.json({
    success: true,
    user: userSafe,
  });
});

// Update Profile & Addresses
router.put('/profile', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { name, phone, addresses } = req.body;
    const updated = db.users.update(req.user!._id, {
      ...(name ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(addresses ? { addresses } : {}),
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const { password: _, ...userSafe } = updated;
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add / Update Address
router.post('/address', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { fullName, phone, street, city, state, pincode, isDefault, type } = req.body;
    if (!fullName || !phone || !street || !city || !state || !pincode) {
      res.status(400).json({ success: false, message: 'All address fields are required.' });
      return;
    }

    const user = req.user!;
    const newAddress = {
      id: 'addr_' + Math.random().toString(36).substring(2, 8),
      fullName,
      phone,
      street,
      city,
      state,
      pincode,
      type: type || 'home',
      isDefault: isDefault || user.addresses.length === 0,
    };

    let updatedAddresses = [...user.addresses];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddress);

    const updated = db.users.update(user._id, { addresses: updatedAddresses });
    const { password: _, ...userSafe } = updated!;

    res.json({
      success: true,
      message: 'Address saved successfully.',
      user: userSafe,
      address: newAddress,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Change Password
router.put('/change-password', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current password and new password are required.' });
      return;
    }

    const user = db.users.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password || '');
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);
    db.users.update(user._id, { password: hashedPassword });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Forgot Password mock / link generator
router.post('/forgot-password', (req: AuthRequest, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required.' });
    return;
  }
  const user = db.users.findByEmail(email);
  if (!user) {
    // For security, don't expose user existence
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been dispatched.',
    });
    return;
  }
  // Return demo reset token for academic demonstration
  res.json({
    success: true,
    message: 'Password reset link sent! (Demo mode token generated).',
    demoToken: 'demo_reset_' + Buffer.from(user.email).toString('base64'),
  });
});

// Reset Password with token
router.post('/reset-password', (req: AuthRequest, res: Response): void => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ success: false, message: 'Email and new password are required.' });
    return;
  }
  const user = db.users.findByEmail(email);
  if (!user) {
    res.status(404).json({ success: false, message: 'Account not found.' });
    return;
  }
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);
  db.users.update(user._id, { password: hashedPassword });

  res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
});

// Logout
router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
