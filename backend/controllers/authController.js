const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');
const Notification = require('../models/Notification');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'secret_fallback',
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

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
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
        });

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
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
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
  updateUserProfile
};
