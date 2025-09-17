import { Router } from "express";
import { 
    createFAQ,
    getAllFAQs,
    updateFAQ,
    deleteFAQ,
    getFAQCount
} from "../controllers/faq.controller.js";
import { verifyJWT, hasAdminPermissions } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getAllFAQs);
router.use(verifyJWT, hasAdminPermissions); 
router.get("/count", getFAQCount);
router.post("/", createFAQ);
router.patch("/:faqId", updateFAQ);
router.delete("/:faqId", deleteFAQ);

export default router;
