import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { callNext, completeCurrent, createQueue, getQueue, joinQueue, leaveQueue, listBusinessQueues, skipCurrent } from '../controllers/queueController.js';

const router = Router();
router.get('/business/:businessId', protect, listBusinessQueues);
router.post('/', protect, authorize('owner'), createQueue);
router.get('/:queueId', protect, getQueue);
router.post('/:queueId/join', protect, authorize('customer'), joinQueue);
router.post('/:queueId/next', protect, authorize('owner', 'staff'), callNext);
router.post('/:queueId/complete', protect, authorize('owner', 'staff'), completeCurrent);
router.post('/:queueId/skip', protect, authorize('owner', 'staff'), skipCurrent);
router.post('/:queueId/leave', protect, authorize('customer'), leaveQueue);

export default router;
