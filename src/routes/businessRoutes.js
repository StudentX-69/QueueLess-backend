import { Router } from 'express';
import { createBusiness, listBusinesses, listMyBusinesses } from '../controllers/businessController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();
router.get('/', protect, listBusinesses);
router.get('/mine', protect, authorize('owner', 'staff'), listMyBusinesses);
router.post('/', protect, authorize('owner'), createBusiness);

export default router;
