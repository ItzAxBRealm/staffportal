import { Router } from "express";
import { 
    getMessageById,
    updateMessageContent,
    deleteMessage,
    uploadMessageAttachment,
    deleteMessageAttachment,
    getMessageThread,
    toggleMessagePin
} from "../controllers/message.controller.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);
router.get("/:messageId", getMessageById);
router.patch("/:messageId", updateMessageContent);
router.delete("/:messageId", deleteMessage);
router.post("/:messageId/attachments", upload.single("attachment"), uploadMessageAttachment);
router.delete("/:messageId/attachments/:attachmentUrl", (req, res, next) => {
    next();
}, deleteMessageAttachment);
router.get("/:messageId/thread", getMessageThread);
router.patch("/:messageId/pin", isAdmin, toggleMessagePin);

export default router;
