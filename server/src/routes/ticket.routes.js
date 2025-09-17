import { Router } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import {
    createTicket,
    uploadAttachment,
    deleteAttachment,
    getAttachments,
    getTickets,
    getParticipantTickets,
    getTicketById,
    updateTicketStatus,
    updateTicketPriority,
    addReplyToTicket,
    getTicketReplies,
    closeTicket,
    deleteTicket,
    updateTicket,
    assignTicket,
    addParticipant,
    removeParticipant
} from "../controllers/ticket.controller.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs"; 

const router = Router();

router.use(verifyJWT);

const validateTicketId = (req, res, next) => {
    const { ticketId } = req.params;
    if (!ticketId) {
        return res.status(400).json(new ApiError(400, "Ticket ID is required"));
    }
    
    const cleanTicketId = ticketId.trim();
    
    if (!mongoose.Types.ObjectId.isValid(cleanTicketId)) {
        console.error(`Invalid ticket ID format in request: '${cleanTicketId}'`);
        return res.status(400).json(new ApiError(400, "Invalid ticket ID format. Please check that you're using a valid ticket ID."));
    }
    
    req.params.ticketId = cleanTicketId;
    next();
};

router.post("/", (req, res, next) => {
    console.log('Receiving new ticket request with content-type:', req.headers['content-type']);
    console.log('Content length:', req.headers['content-length']);
    next();
}, multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const tempDir = './public/temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        console.log(`Received file: ${file.originalname} (${file.mimetype}, size: ${file.size || 'unknown'} bytes)`);
        cb(null, true); 
    },
    limits: {
        fileSize: 10 * 1024 * 1024, 
        files: 5
    }
}).array('attachments', 5), 
(err, req, res, next) => {
    if (err) {
        console.error('Multer error in ticket creation:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        console.error('Request headers:', req.headers);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ 
                success: false, 
                message: 'File too large. Maximum file size is 10MB.' 
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                success: false, 
                message: 'Unexpected file field or too many files.' 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'File upload error: ' + err.message 
        });
    }
    next();
}, 
createTicket);
router.get("/participants/me", getParticipantTickets);
router.get("/", getTickets); 
router.get("/:ticketId", validateTicketId, getTicketById);
router.delete("/:ticketId", validateTicketId, deleteTicket);

router.patch("/:ticketId/status", validateTicketId, updateTicketStatus);
router.patch("/:ticketId/close", validateTicketId, closeTicket);

router.patch("/:ticketId/assign", validateTicketId, isAdmin, assignTicket);
router.patch("/:ticketId/priority", validateTicketId, isAdmin, updateTicketPriority);

router.put("/:ticketId", validateTicketId, upload.array('attachments', 5), (req, res, next) => {
    console.log('Updating ticket with content-type:', req.headers['content-type']);
    console.log('Update route accessed for ticket ID:', req.params.ticketId);
    console.log('Request body:', req.body);
    console.log('Files received:', req.files?.length || 0);
    next();
}, updateTicket);
router.post("/:ticketId/attachments", validateTicketId, upload.single("attachment"), uploadAttachment);
router.get("/:ticketId/attachments", validateTicketId, getAttachments);
router.delete("/:ticketId/attachments/:attachmentUrl", validateTicketId, (req, res, next) => {
    next();
}, deleteAttachment);
router.patch("/:ticketId/status", validateTicketId, updateTicketStatus);
router.post("/:ticketId/replies", validateTicketId, (req, res, next) => {
    console.log('Receiving ticket reply with content-type:', req.headers['content-type']);
    console.log('Content length:', req.headers['content-length']);
    next();
}, multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const tempDir = './public/temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        console.log(`Received attachment for reply: ${file.originalname} (${file.mimetype}, ${file.size || 'unknown'} bytes)`);
        cb(null, true); 
    },
    limits: {
        fileSize: 10 * 1024 * 1024, 
        files: 5
    }
}).array('attachments', 5), 
(err, req, res, next) => {
    if (err) {
        console.error('Multer error in ticket replies:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ 
                success: false, 
                message: 'File too large. Maximum file size is 10MB.' 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'File upload error: ' + err.message 
        });
    }
    next();
}, 
addReplyToTicket);

router.get("/:ticketId/replies", getTicketReplies);
router.patch("/:ticketId/close", closeTicket);
router.post("/:ticketId/participants", addParticipant);
router.delete("/:ticketId/participants", removeParticipant);

export default router;
