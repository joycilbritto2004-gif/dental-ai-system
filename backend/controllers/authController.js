const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');
const Notification = require('../models/Notification');

// Generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Fatal: JWT_SECRET environment variable is not configured.');
  }
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Escape user-provided text before inserting it into HTML emails
const escapeHtml = (text = '') => {
  return String(text).replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
};

// Send email without interrupting registration or login
const sendNotification = (options) => {
  sendEmail(options).catch((error) => {
    console.error('DentaAI email notification failed:', error.message);
  });
};

// Password security validation policy:
// Enforce minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
const validatePasswordSecurity = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character or symbol.';
  }
  return null;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Enforce password security policy
    const passwordError = validatePasswordSecurity(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Public registration may only create patient or doctor accounts.
    // Admin accounts are provisioned out-of-band by seedAdmin.js — never from a request body,
    // otherwise anyone could POST { role: 'admin' } and read every patient record.
    const SELF_REGISTERABLE_ROLES = ['patient', 'doctor'];
    const requestedRole = String(req.body.role || 'patient').toLowerCase();
    if (!SELF_REGISTERABLE_ROLES.includes(requestedRole)) {
      return res.status(403).json({ message: 'This account type cannot be self-registered' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole,
      phone,
      // Doctors stay unapproved until an admin verifies them; patients need no verification.
      verificationStatus: requestedRole === 'doctor' ? 'Pending' : 'Approved',
    });

    if (user) {
      // Send welcome email to patients and doctors
      const role = String(user.role).toLowerCase();
      if (role === 'patient' || role === 'doctor') {
        const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
        const safeName = escapeHtml(user.name || roleCapitalized);

        let welcomeMessage = '';
        let welcomeHtml = '';

        if (role === 'patient') {
            welcomeMessage = `Hello ${user.name || 'Patient'},\n\nWelcome to DentaAI!\n\nYour patient account has been successfully registered.\n\nYou can now log in to DentaAI to upload dental images, view preliminary AI-assisted assessments, and access available consultation features.\n\nPlease remember that AI-generated results are preliminary and are not a substitute for professional dental advice.\n\nThank you for choosing DentaAI.\n\nRegards,\nDentaAI Team`;
            
            welcomeHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
              <h2 style="color: #2563eb;">Welcome to DentaAI!</h2>
              <p>Hello ${safeName},</p>
              <p>Your patient account has been successfully registered.</p>
              <p>You can now log in to DentaAI to upload dental images, view preliminary AI-assisted assessments, and access available consultation features.</p>
              <div style="background: #eff6ff; padding: 16px; border-radius: 8px;">
                <strong>Important:</strong> AI-generated results are preliminary and do not replace examination or advice from a qualified dental professional.
              </div>
              <p>Thank you for choosing DentaAI.</p>
              <p>Regards,<br /><strong>DentaAI Team</strong></p>
            </div>
          `;
        } else {
            welcomeMessage = `Hello ${user.name || 'Doctor'},\n\nWelcome to DentaAI!\n\nYour doctor account has been successfully registered.\n\nYou can now log in to DentaAI to manage consultations, review AI-assisted assessments, and provide expert diagnoses to patients.\n\nThank you for joining DentaAI.\n\nRegards,\nDentaAI Team`;
            
            welcomeHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
              <h2 style="color: #2563eb;">Welcome to DentaAI!</h2>
              <p>Hello ${safeName},</p>
              <p>Your doctor account has been successfully registered.</p>
              <p>You can now log in to DentaAI to manage consultations, review AI-assisted assessments, and provide expert diagnoses to patients.</p>
              <p>Thank you for joining DentaAI.</p>
              <p>Regards,<br /><strong>DentaAI Team</strong></p>
            </div>
          `;
        }

        sendNotification({
          email: user.email,
          subject: 'Welcome to DentaAI - Registration Successful',
          message: welcomeMessage,
          html: welcomeHtml,
          deduplicationKey: `reg_${user._id}_email`,
          event: 'registration',
        });

        // Dispatch registration SMS if phone provided
        if (user.phone) {
          sendSMS({
            to: user.phone,
            templateName: 'REGISTRATION',
            templateData: { name: user.name, role },
            deduplicationKey: `reg_${user._id}_sms`,
          }).catch((smsErr) => console.error('Registration SMS error:', smsErr.message));
        }

        // Also notify the admin
        if (process.env.ADMIN_EMAIL) {
          const regTime = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
          });

          sendNotification({
            email: process.env.ADMIN_EMAIL,
            subject: `New ${roleCapitalized} Registration - DentaAI`,
            message: `Admin Alert: A new ${role} has registered on DentaAI.\n\nName: ${user.name || 'N/A'}\nEmail: ${user.email}\nDate: ${regTime} (IST)\n\nRegards,\nDentaAI System`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
                <h2 style="color: #2563eb;">New ${roleCapitalized} Registered</h2>
                <p>A new ${role} account was just created on DentaAI.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
                  <p><strong>Name:</strong> ${safeName}</p>
                  <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
                  <p><strong>Registration Time:</strong> ${escapeHtml(regTime)} IST</p>
                </div>
                <p>Regards,<br/><strong>DentaAI System</strong></p>
              </div>
            `
          });
        }
        
        // Also create in-app notifications for all admins
        try {
          const admins = await User.find({ role: 'admin' });
          const regTime = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          
          const notifs = admins.map(admin => ({
            recipientId: admin._id.toString(),
            recipientRole: 'admin',
            title: `New ${roleCapitalized} Registration`,
            message: `${safeName} (${user.email}) has just registered on ${regTime} IST.`,
            type: 'info'
          }));
          
          if (notifs.length > 0) {
            await Notification.insertMany(notifs);
          }
        } catch (notifErr) {
          console.error('Failed to create admin in-app notification:', notifErr.message);
        }
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        accountStatus: user.accountStatus,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, loginRole } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Enforce role-based login
      if (loginRole && user.role !== loginRole) {
        const expectedRoleStr = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        return res.status(403).json({ message: `Invalid login type. Please use the ${expectedRoleStr} Login.` });
      }

      if (user.accountStatus === 'Blocked') {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      }

      // Send login alert to patients and doctors
      const role = String(user.role).toLowerCase();
      if (role === 'patient' || role === 'doctor') {
        const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
        const safeName = escapeHtml(user.name || roleCapitalized);

        const loginTime = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        sendNotification({
          email: user.email,
          subject: 'DentaAI - New Login Notification',
          message: `Hello ${user.name || roleCapitalized},\n\nYour DentaAI account was successfully accessed.\n\nLogin time: ${loginTime} (IST)\n\nIf this was you, no action is required.\n\nIf you do not recognize this login, please change your password and contact DentaAI support.\n\nRegards,\nDentaAI Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
              <h2 style="color: #2563eb;">New Login Notification</h2>
              <p>Hello ${safeName},</p>
              <p>Your DentaAI account was successfully accessed.</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
                <strong>Login time:</strong> ${escapeHtml(loginTime)} IST
              </div>
              <p>If this was you, no action is required.</p>
              <p>If you do not recognize this login, please change your password and contact DentaAI support.</p>
              <p>Regards,<br /><strong>DentaAI Team</strong></p>
            </div>
          `,
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        accountStatus: user.accountStatus,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Disallow modifying security sensitive attributes
      if (req.body.role && req.body.role !== user.role) {
        return res.status(403).json({ message: 'Modifying account role is not permitted' });
      }
      if (req.body.verificationStatus && req.body.verificationStatus !== user.verificationStatus) {
        return res.status(403).json({ message: 'Modifying verification status is not permitted' });
      }
      if (req.body.accountStatus && req.body.accountStatus !== user.accountStatus) {
        return res.status(403).json({ message: 'Modifying account status is not permitted' });
      }
      if (req.body.email && req.body.email.toLowerCase() !== user.email.toLowerCase()) {
        return res.status(403).json({ message: 'Modifying verified email address is not permitted' });
      }

      let hasModifications = false;

      if (req.body.name !== undefined) {
        const trimmedName = String(req.body.name).trim();
        if (!trimmedName) {
          return res.status(400).json({ message: 'Full name cannot be empty' });
        }
        if (trimmedName !== user.name) {
          user.name = trimmedName;
          hasModifications = true;
        }
      }

      if (req.body.phone !== undefined) {
        const trimmedPhone = String(req.body.phone).trim();
        if (trimmedPhone !== (user.phone || '')) {
          user.phone = trimmedPhone;
          hasModifications = true;
        }
      }
      
      if (req.body.password !== undefined && String(req.body.password).trim() !== '') {
        const pwd = String(req.body.password);
        const passwordError = validatePasswordSecurity(pwd);
        if (passwordError) {
          return res.status(400).json({ message: passwordError });
        }
        user.password = pwd;
        hasModifications = true;
      }

      // Doctor-specific profile fields
      if (user.role === 'doctor') {
        if (req.body.specialization !== undefined) {
          const val = String(req.body.specialization).trim();
          if (val !== (user.specialization || '')) { user.specialization = val; hasModifications = true; }
        }
        if (req.body.clinic !== undefined) {
          const val = String(req.body.clinic).trim();
          if (val !== (user.clinic || '')) { user.clinic = val; hasModifications = true; }
        }
        if (req.body.location !== undefined) {
          const val = String(req.body.location).trim();
          if (val !== (user.location || '')) { user.location = val; hasModifications = true; }
        }
        if (req.body.experience !== undefined) {
          const val = String(req.body.experience).trim();
          if (val !== (user.experience || '')) { user.experience = val; hasModifications = true; }
        }
        if (req.body.languages !== undefined) {
          const val = String(req.body.languages).trim();
          if (val !== (user.languages || '')) { user.languages = val; hasModifications = true; }
        }
        if (req.body.bio !== undefined) {
          const val = String(req.body.bio).trim();
          if (val !== (user.bio || '')) { user.bio = val; hasModifications = true; }
        }
        if (req.body.fee !== undefined) {
          const numFee = Number(req.body.fee);
          if (isNaN(numFee) || numFee < 0) {
            return res.status(400).json({ message: 'Consultation fee must be a valid non-negative number' });
          }
          if (numFee !== user.fee) {
            user.fee = numFee;
            hasModifications = true;
          }
        }
      }

      if (!hasModifications) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verificationStatus: user.verificationStatus,
          accountStatus: user.accountStatus,
          specialization: user.specialization,
          clinic: user.clinic,
          location: user.location,
          fee: user.fee,
          experience: user.experience,
          languages: user.languages,
          bio: user.bio,
          message: 'No changes detected.'
        });
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        verificationStatus: updatedUser.verificationStatus,
        accountStatus: updatedUser.accountStatus,
        specialization: updatedUser.specialization,
        clinic: updatedUser.clinic,
        location: updatedUser.location,
        fee: updatedUser.fee,
        experience: updatedUser.experience,
        languages: updatedUser.languages,
        bio: updatedUser.bio,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  validatePasswordSecurity
};
