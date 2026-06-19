'use strict';

const { query } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { asyncHandler, ApiError } = require('../utils/http');
const { publicUser } = require('../utils/serialize');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['seeker', 'owner'];

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { email, password, name, role, gender, occupation, mobile_number } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, 'A valid email is required');
  if (!password || String(password).length < 6)
    throw new ApiError(400, 'Password must be at least 6 characters');
  if (!name || !String(name).trim()) throw new ApiError(400, 'Name is required');

  const finalRole = VALID_ROLES.includes(role) ? role : 'seeker';
  const password_hash = await hashPassword(String(password));

  const { rows } = await query(
    `INSERT INTO users (email, password_hash, name, role, gender, occupation, mobile_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      String(email).toLowerCase().trim(),
      password_hash,
      String(name).trim(),
      finalRole,
      gender || null,
      occupation || null,
      mobile_number || null,
    ]
  );

  const user = rows[0];
  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [
    String(email).toLowerCase().trim(),
  ]);
  const user = rows[0];
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const ok = await comparePassword(String(password), user.password_hash);
  if (!ok) throw new ApiError(401, 'Invalid email or password');

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  res.json({ user: publicUser(rows[0]) });
});

module.exports = { register, login, me };
