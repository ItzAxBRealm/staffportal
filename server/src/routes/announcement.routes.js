import { Router } from "express";
import { 
    createAnnouncement,
    getAllAnnouncements,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementCount,
    getAnnouncementById
} from "../controllers/announcement.controller.js";
import { verifyJWT, hasAdminPermissions } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.get("/", getAnnouncements);
router.get("/:announcementId", getAnnouncementById);
router.use(hasAdminPermissions); 
router.post("/", createAnnouncement);
router.patch("/:announcementId", updateAnnouncement);
router.delete("/:announcementId", deleteAnnouncement);
router.get("/all", getAllAnnouncements);
router.get("/count", getAnnouncementCount); 

export default router;
