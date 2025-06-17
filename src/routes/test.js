/**
 * Test routes
 */
import express from 'express';
import * as TestController from '../controllers/testController';

const router = express.Router();

// GET /api/test
router.get('/api/test', TestController.getAll);


// POST /api/test/items
router.post('/api/test/items', TestController.create);

export default router;