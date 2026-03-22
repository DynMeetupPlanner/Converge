import express from 'express';
import {login ,register} from '../controllers/AuthControllers.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/register',register);

router.post('/login',login);

export default router;
/*
router
    .route("/test")
    .get()...
    .post()...

Format for writing multiple statements at once

*/