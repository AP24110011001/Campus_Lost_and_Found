import { Router, Request, Response } from 'express';
import { db } from '../db';
import { User } from '../types';
import { isDemoMode } from '../middleware/auth';

export const usersRouter = Router();

// Get all demo users
usersRouter.get('/', (_req: Request, res: Response) => {
  const users = db.prepare('SELECT id, name, email, role, avatar_color, department, created_at FROM users ORDER BY created_at ASC').all();
  res.json({ users, is_demo_mode: isDemoMode() });
});

// Get current signed-in user
usersRouter.get('/me', (req: Request, res: Response) => {
  res.json({
    user: req.user || null,
    is_authenticated: Boolean(req.user),
    is_demo_mode: isDemoMode(),
  });
});

// Switch active demo user or create a temporary one
usersRouter.post('/switch', (req: Request, res: Response) => {
  if (!isDemoMode()) {
    res.status(403).json({ error: 'Demo persona switching is disabled in this environment.' });
    return;
  }

  const { userId, name, email, role, department } = req.body;

  if (userId) {
    const user = db.prepare('SELECT id, name, email, role, avatar_color, department, created_at FROM users WHERE id = ?').get(userId) as User | undefined;
    if (!user) {
      res.status(404).json({ error: 'Demo user persona not found.' });
      return;
    }
    res.json({ user, message: `Switched to ${user.name}` });
    return;
  }

  // Create custom demo persona
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    res.status(400).json({ error: 'Full name is required and must be between 2 and 60 characters.' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  const validRoles = ['student', 'staff', 'faculty'];
  const userRole = validRoles.includes(role) ? role : 'student';

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanDept = typeof department === 'string' && department.trim() ? department.trim().slice(0, 80) : 'General Campus';

  // Check if email already exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as User | undefined;
  if (existingUser) {
    res.json({ user: existingUser, message: `Switched to existing persona ${existingUser.name}` });
    return;
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const colors = [
    'bg-indigo-600 text-white',
    'bg-emerald-600 text-white',
    'bg-rose-600 text-white',
    'bg-amber-600 text-white',
    'bg-teal-600 text-white',
    'bg-cyan-600 text-white',
  ];
  const avatar_color = colors[Math.floor(Math.random() * colors.length)];
  const created_at = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO users (id, name, email, role, avatar_color, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, cleanName, cleanEmail, userRole, avatar_color, cleanDept, created_at);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
    res.status(201).json({ user: newUser, message: `Created and switched to ${newUser.name}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create demo persona.' });
  }
});
