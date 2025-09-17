import { Router } from "express";
import userRoutes from "./user.routes.js";
import ticketRoutes from "./ticket.routes.js";
import messageRoutes from "./message.routes.js";
import faqRoutes from "./faq.routes.js";
import announcementRoutes from "./announcement.routes.js";
import notificationRoutes from "./notification.routes.js";
import adminRoutes from "./admin.routes.js";
import meetingRoomRoutes from "./meetingRoom.routes.js";

const router = Router();

router.use("/api/users", userRoutes);
router.use("/api/tickets", ticketRoutes);
router.use("/api/messages", messageRoutes);
router.use("/api/faqs", faqRoutes);
router.use("/api/announcements", announcementRoutes);
router.use("/api/notifications", notificationRoutes);
router.use("/api/admin", adminRoutes);
router.use("/api/meetingRoom", meetingRoomRoutes);

export default router;