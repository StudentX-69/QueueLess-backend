import Business from '../models/Business.js';
import Queue from '../models/Queue.js';

export async function listBusinesses(req, res) {
  const businesses = await Business.find({ active: true }).sort({ createdAt: -1 }).lean();
  const queues = await Queue.find({ business: { $in: businesses.map((item) => item._id) }, status: { $ne: 'CLOSED' } }).lean();

  const grouped = businesses.map((business) => ({
    ...business,
    queues: queues.filter((queue) => queue.business.toString() === business._id.toString()),
  }));

  res.json({ businesses: grouped });
}

export async function listMyBusinesses(req, res) {
  const businesses = await Business.find({ $or: [{ owner: req.user._id }, { staff: req.user._id }] }).sort({ createdAt: -1 }).lean();
  const queues = await Queue.find({ business: { $in: businesses.map((item) => item._id) } }).lean();
  const grouped = businesses.map((business) => ({
    ...business,
    queues: queues.filter((queue) => queue.business.toString() === business._id.toString()),
  }));
  res.json({ businesses: grouped });
}

export async function createBusiness(req, res) {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Business name is required.' });

  const business = await Business.create({ name: name.trim(), description, owner: req.user._id });
  res.status(201).json({ business });
}
