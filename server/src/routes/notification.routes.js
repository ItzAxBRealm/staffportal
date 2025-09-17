import { Router } from "express";
import { 
    getUserNotifications, 
    getNotificationById,
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification,
    deleteAllNotifications
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.get("/", getUserNotifications);
router.get("/:notificationId", getNotificationById);
router.patch("/:notificationId/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);
router.delete("/delete-all", deleteAllNotifications);
router.delete("/:notificationId", deleteNotification);

export default router;
