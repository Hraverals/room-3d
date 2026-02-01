import { Router } from "express";
const router = Router();

import roomRouter from './room.js';


router.use('/room', roomRouter);


export default router;