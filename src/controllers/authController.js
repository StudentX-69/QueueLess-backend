import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export async function register(req, res) {
  const { name, email, password, role = 'customer' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (!['customer', 'owner', 'staff'].includes(role)) {
    return res.status(400).json({ message: 'Public registration only supports customer, owner, or staff accounts.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

  const user = await User.create({ name, email: email.toLowerCase(), password, role });
  const safeUser = { _id: user._id, name: user.name, email: user.email, role: user.role };

  res.status(201).json({ token: signToken(user._id.toString()), user: safeUser });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json({
    token: signToken(user._id.toString()),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
