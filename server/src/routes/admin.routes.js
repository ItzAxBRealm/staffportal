import { Router } from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.use(verifyJWT);
router.use(isAdmin);
router.get("/stats", getAdminStats);

export default router;
