const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const secretKey = process.env.JWT_SECRET || 'alex';

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Verify owner role
const verifyOwner = (req, res, next) => {
  if (req.userRole !== 'proprietaire') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['mdp'] }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyOwner,
  getCurrentUser
};
