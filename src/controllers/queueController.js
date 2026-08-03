import Business from '../models/Business.js';
import Queue from '../models/Queue.js';
import QueueEntry from '../models/QueueEntry.js';
import { getQueueRoom, getUserRoom } from '../utils/queue.js';

async function canManageQueue(queue, userId) {
  const business = await Business.findOne({
    _id: queue.business,
    $or: [{ owner: userId }, { staff: userId }],
  });
  return Boolean(business);
}

async function emitQueueUpdate(io, queueId) {
  const queue = await Queue.findById(queueId).populate('business', 'name').lean();
  io.to(getQueueRoom(queueId)).emit('queue:updated', { queueId: queueId.toString(), queue });
  return queue;
}

export async function createQueue(req, res) {
  const { businessId, name } = req.body;
  const business = await Business.findOne({ _id: businessId, owner: req.user._id });
  if (!business) return res.status(403).json({ message: 'Only the business owner can create queues.' });
  if (!name?.trim()) return res.status(400).json({ message: 'Queue name is required.' });

  const queue = await Queue.create({ business: businessId, name: name.trim() });
  res.status(201).json({ queue });
}

export async function listBusinessQueues(req, res) {
  const queues = await Queue.find({ business: req.params.businessId }).sort({ createdAt: -1 });
  res.json({ queues });
}

export async function getQueue(req, res) {
  const queue = await Queue.findById(req.params.queueId).populate('business', 'name description');
  if (!queue) return res.status(404).json({ message: 'Queue not found.' });

  const myTicket = await QueueEntry.findOne({
    queue: queue._id,
    customer: req.user._id,
    status: { $in: ['WAITING', 'CALLED', 'SERVING'] },
  }).sort({ createdAt: -1 });

  let peopleAhead = 0;
  if (myTicket) {
    peopleAhead = await QueueEntry.countDocuments({
      queue: queue._id,
      tokenNumber: { $lt: myTicket.tokenNumber },
      status: { $in: ['WAITING', 'CALLED', 'SERVING'] },
    });
  }

  res.json({ queue, myTicket, peopleAhead });
}

export async function joinQueue(req, res) {
  const queue = await Queue.findById(req.params.queueId);
  if (!queue) return res.status(404).json({ message: 'Queue not found.' });
  if (queue.status !== 'OPEN') return res.status(400).json({ message: 'This queue is not accepting customers.' });

  const existing = await QueueEntry.findOne({ queue: queue._id, customer: req.user._id, status: { $in: ['WAITING', 'CALLED', 'SERVING'] } });
  if (existing) return res.status(409).json({ message: 'You already have an active ticket in this queue.', ticket: existing });

  const ticket = await QueueEntry.create({
    queue: queue._id,
    customer: req.user._id,
    tokenNumber: queue.nextTokenNumber,
  });

  queue.nextTokenNumber += 1;
  await queue.save();

  await emitQueueUpdate(req.app.get('io'), queue._id.toString());
  res.status(201).json({ ticket });
}

export async function callNext(req, res) {
  const queue = await Queue.findById(req.params.queueId);
  if (!queue) return res.status(404).json({ message: 'Queue not found.' });
  if (!(await canManageQueue(queue, req.user._id))) return res.status(403).json({ message: 'You cannot manage this queue.' });

  const current = await QueueEntry.findOne({ queue: queue._id, status: { $in: ['CALLED', 'SERVING'] } });
  if (current) return res.status(400).json({ message: 'Finish the current customer before calling the next one.' });

  const next = await QueueEntry.findOne({ queue: queue._id, status: 'WAITING' }).sort({ tokenNumber: 1 });
  if (!next) return res.status(400).json({ message: 'No waiting customers.' });

  next.status = 'CALLED';
  next.calledAt = new Date();
  await next.save();

  queue.currentToken = next.tokenNumber;
  await queue.save();

  const io = req.app.get('io');
  const populatedQueue = await emitQueueUpdate(io, queue._id.toString());
  io.to(getUserRoom(next.customer.toString())).emit('token:called', {
    queueId: queue._id.toString(),
    tokenNumber: next.tokenNumber,
    customerId: next.customer.toString(),
    counterName: next.counterName || 'the counter',
  });

  res.json({ queue: populatedQueue, ticket: next });
}

export async function completeCurrent(req, res) {
  const queue = await Queue.findById(req.params.queueId);
  if (!queue) return res.status(404).json({ message: 'Queue not found.' });
  if (!(await canManageQueue(queue, req.user._id))) return res.status(403).json({ message: 'You cannot manage this queue.' });

  const current = await QueueEntry.findOne({ queue: queue._id, status: { $in: ['CALLED', 'SERVING'] } });
  if (!current) return res.status(400).json({ message: 'There is no active customer.' });

  current.status = 'COMPLETED';
  current.servedAt = new Date();
  await current.save();

  const queueData = await emitQueueUpdate(req.app.get('io'), queue._id.toString());
  res.json({ queue: queueData, ticket: current });
}

export async function skipCurrent(req, res) {
  const queue = await Queue.findById(req.params.queueId);
  if (!queue) return res.status(404).json({ message: 'Queue not found.' });
  if (!(await canManageQueue(queue, req.user._id))) return res.status(403).json({ message: 'You cannot manage this queue.' });

  const current = await QueueEntry.findOne({ queue: queue._id, status: { $in: ['CALLED', 'SERVING'] } });
  if (!current) return res.status(400).json({ message: 'There is no active customer.' });

  current.status = 'SKIPPED';
  current.servedAt = new Date();
  await current.save();

  const queueData = await emitQueueUpdate(req.app.get('io'), queue._id.toString());
  res.json({ queue: queueData, ticket: current });
}

export async function leaveQueue(req, res) {
  const ticket = await QueueEntry.findOne({ queue: req.params.queueId, customer: req.user._id, status: { $in: ['WAITING', 'CALLED'] } });
  if (!ticket) return res.status(404).json({ message: 'No active ticket found.' });

  ticket.status = 'CANCELLED';
  await ticket.save();
  await emitQueueUpdate(req.app.get('io'), req.params.queueId);
  res.json({ ticket });
}
