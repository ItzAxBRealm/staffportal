import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { storeFile, deleteFile, clearFile } from "../utils/fileStorage.js";
import { Ticket } from '../models/ticket.models.js';
import { Message } from '../models/message.models.js';
import { User } from '../models/user.models.js';
import mongoose from 'mongoose';
import { 
    sendTicketReplyNotification, 
    sendTicketAssignmentNotification, 
    sendTicketOwnerAssignmentNotification,
    sendTicketStatusChangeNotification,
    sendNewTicketNotification,
    sendParticipantAddedNotification,
    sendTicketOwnerParticipantNotification
} from '../utils/emailNotifier.js';
import NotificationService from '../utils/notificationService.js';
import fs from 'fs';
import path from 'path';

const createTicket = asyncHandler( async(req, res) => {
    const files = req.files || [];
    const { title, content, priority } = req.body;

    if(!title?.trim() || !content?.trim()){
        throw new ApiError(400, "Title and content are required");
    }

    const lastTicket = await Ticket.findOne().sort({ ticketId: -1 });
    let nextTicketNumber = 1;
    
    if (lastTicket && lastTicket.ticketId) {
        const lastNumber = parseInt(lastTicket.ticketId);
        nextTicketNumber = lastNumber + 1;
    }
    
    const ticketId = nextTicketNumber.toString().padStart(2, '0');

    const ticket = await Ticket.create({
        ticketId: ticketId,
        title: title.trim(),
        content: content,
        priority: priority || "Standard",
        status: "open",
        createdBy: req.user._id,
        attachments: [], 
        messages: [],
        participants: []
    });

    if (!ticket){
        throw new ApiError(500, "Failed to create ticket");
    }
    
    let attachmentUrls = [];
    if(files.length > 0){
        try {
            const tempDir = './public/temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file) {
                    console.warn(`Skipping undefined file at index ${i}`);
                    continue;
                }

                if (!file.path || !fs.existsSync(file.path)) {
                    console.error(`File not found at path: ${file.path || 'unknown path'}`);
                    continue;
                }

                try {
                    const uploadResult = await storeFile(file.path);
                    
                    if (uploadResult && uploadResult.url) {
                        attachmentUrls.push(uploadResult);
                    } 
                    else {
                        console.warn(`File ${i+1} upload failed: No valid result returned`);
                    }
                } 
                catch (uploadErr) {
                    console.error(`Error uploading file ${i+1}:`, uploadErr);
                } 
                finally {
                    try {
                        if (file.path && fs.existsSync(file.path)) {
                            await clearFile(file.path);
                        }
                    } 
                    catch (err) {
                        console.error(`Failed to clear temp file: ${file.path || 'Error'}`, err);
                    }
                }
            }            
            if (attachmentUrls.length > 0) {
                ticket.attachments = attachmentUrls;
                await ticket.save();
            }
        } 
        catch (error) {
            console.error("Error reading attachments:", error);
        }
    }
    
    try {
        const populatedTicket = await Ticket.findById(ticket._id)
            .populate('createdBy', 'fullName email');
        
        const emailResult = await sendNewTicketNotification(populatedTicket);
        if (!emailResult.success) {
            console.error('Failed to send admin notification email:', emailResult.error);
            console.error('SMTP Error details:', emailResult.smtpResponse || 'No SMTP response');
        } 
        else {
            console.log(`New ticket notification email sent to admin: ${process.env.ADMIN_EMAIL}`);
        }
    } 
    catch (emailError) {
        console.error('Exception sending admin notification email:', emailError);
    }
    
    try {
        if (!req.io) {
            console.error('Socket.io instance not available in request');
            return;
        }

        await NotificationService.notifyNewTicket(
            req.io,
            ticket,
            req.user.fullName
        );
    } 
    catch (error) {
        console.error('Failed to send ticket notification:', error);
    }

    return res.status(201).json(new ApiResponse(201, ticket, "Success"))
})  

const uploadAttachment = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { _id: userId, isAdmin } = req.user;

    if (!req.file) {
        throw new ApiError(400, "Attachment file is required");
    }

    const ticket = await Ticket.findOne({
        _id: ticketId,
        ...(!isAdmin && { createdBy: userId })
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }

    if (!fs.existsSync(req.file.path)) {
        console.error(`File not found at path: ${req.file.path}`);
        throw new ApiError(404, "Uploaded file not found");
    }

    const attachmentUrl = await storeFile(req.file.path);
    
    if (!attachmentUrl) {
        throw new ApiError(500, "Failed to upload attachment");
    }

    try {
        await clearFile(req.file.path);
    } 
    catch (error) {
        console.error(`There was a problem clearing temporary file ${req.file.path}:`, error);
    }

    ticket.attachments.push(attachmentUrl);
    await ticket.save();

    return res.status(201).json(new ApiResponse(201, { attachmentUrl }, "Success"));
});

const deleteAttachment = asyncHandler(async (req, res) => {
    const { ticketId, attachmentUrl } = req.params;
    const { _id: userId, isAdmin } = req.user;

    const ticket = await Ticket.findOne({
        _id: ticketId,
        ...(!isAdmin && { createdBy: userId })
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }

    try {
        let filename;
        
        try {
            const urlObj = JSON.parse(attachmentUrl);
            filename = urlObj.url ? urlObj.url.split('/').pop() : null;
        } 
        catch (e) {
            filename = attachmentUrl.split('/').pop();
        }
        
        if (filename) {
            await deleteFile(filename);
        }

        ticket.attachments = ticket.attachments.filter(attachment => {
            const attachmentFileName = attachment.url ? attachment.url.split('/').pop() : attachment.split('/').pop();
            return attachmentFileName !== filename;
        });

        await ticket.save();
        
        return res.status(200).json(new ApiResponse(200, {}, "Deleted successfully"));
    } 
    catch (error) {
        console.error("Error deleting attachment:", error);
        return res.status(500).json(new ApiResponse(500, {}, "Failed to delete attachment"));
    }
});

const getAttachments = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { _id: userId, isAdmin } = req.user;

    const ticket = await Ticket.findOne({
        _id: ticketId,
        ...(!isAdmin && { createdBy: userId })
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }

    return res.status(200).json(new ApiResponse(200, ticket.attachments, "Attachments fetched successfully"));
});

const getTickets = asyncHandler(async(req, res) => {
    const { status, createdBy } = req.query;
    const { _id: userId, isAdmin } = req.user;

    const query = {};

    if(status){
        if(!["open", "in-progress", "resolved"].includes(status)){
            throw new ApiError(400, "Invalid status")
        }
        query.status = status;
    }

    if(!isAdmin){
        query.$or = [
            { createdBy: userId },
            { assignedTo: userId },
            { participants: userId }
        ];
    } 
    else if (createdBy) {
        query.createdBy = createdBy;
    }

    const tickets = await Ticket.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "fullName email")
    .populate("assignedTo", "fullName email")
    .populate("messages")
    .select("+attachments")
    .lean();

    return res.status(200).json(new ApiResponse(200, tickets, "Success"));
});

const getParticipantTickets = asyncHandler(async(req, res) => {
    const { status } = req.query;
    const { _id: userId } = req.user;

    const query = {
        participants: userId
    };

    if(status){
        if(!["open", "in-progress", "resolved"].includes(status)){
            throw new ApiError(400, "Invalid status")
        }
        query.status = status;
    }

    console.log('Fetching participant tickets for user:', userId);
    console.log('Query:', query);
    
    const tickets = await Ticket.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "fullName email")
    .populate("assignedTo", "fullName email")
    .populate("participants", "fullName email")
    .populate("messages")
    .select("+attachments")
    .lean();

    console.log('Found participant tickets:', tickets.length);
    return res.status(200).json(new ApiResponse(200, tickets, "Success"));
});

const getTicketById = asyncHandler(async(req, res) => {
    const { ticketId } = req.params;
    const { _id: userId, isAdmin } = req.user;

    if(!ticketId) {
        throw new ApiError(400, "Ticket ID is required");
    }
    
    let cleanTicketId = ticketId.trim();
    
    if(!mongoose.Types.ObjectId.isValid(cleanTicketId)){
        console.error(`Invalid ticket ID format: '${cleanTicketId}'`);
        throw new ApiError(400, "Invalid ticket ID format. Please check that you're using a valid ticket ID.");
    }

    const query = {
        _id: ticketId
    };

    if(!isAdmin){
        query.$or = [
            { createdBy: userId },
            { assignedTo: userId },
            { participants: userId }
        ];
    }

    const ticket = await Ticket.findOne(query)
        .populate("createdBy", "fullName email")
        .populate("participants", "fullName email")
        .populate({
            path: "messages",
            populate: {
                path: "sender",
                select: "fullName jobRole"
            }
        })
        .select("+attachments");

    if(!ticket){
        throw new ApiError(404, "Ticket not found or access denied")
    }

    return res.status(200).json(new ApiResponse(200, ticket, "Ticket fetched successfully"))
})

const updateTicketStatus = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { status } = req.body;
    const { _id: userId, isAdmin } = req.user;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new ApiError(400, "Invalid ticket ID");
    }

    if (!["open", "in-progress", "resolved"].includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    const query = { _id: ticketId };
    if (!isAdmin) {
        query.createdBy = userId; 
    }

    const ticket = await Ticket.findOne(query).populate('createdBy', 'fullName email');
    if (!ticket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }
    
    const previousStatus = ticket.status;
    
    ticket.status = status;
    await ticket.save({ validateModifiedOnly: true });
    const updatedTicket = ticket;

    if (!updatedTicket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }
    
    if (updatedTicket.createdBy && updatedTicket.createdBy.email && previousStatus !== status) {
        sendTicketStatusChangeNotification(updatedTicket, previousStatus, status)
            .then(result => {
                if (!result.success) {
                    console.error('Failed to send status change notification:', result.error);
                } 
                else {
                    console.log(`Status change email sent successfully to ${updatedTicket.createdBy.email}`);
                }
            })
            .catch(error => console.error('Exception sending status change email:', error));
    }
    
    if (updatedTicket.createdBy._id.toString() !== userId.toString()) {
        try {
            await NotificationService.sendNotification(req.io, {
                recipient: updatedTicket.createdBy._id,
                title: 'Ticket Status Updated',
                message: `Your ticket "${updatedTicket.title}" has been updated to ${status}`,
                type: 'ticket',
                link: `/tickets/${updatedTicket._id}`,
                metadata: {
                    ticketId: updatedTicket._id,
                    senderId: userId
                }
            });
        } 
        catch (error) {
            console.error('Failed to send status notification:', error);
        }
    }

    const populatedTicket = await Ticket.findById(ticketId)
        .populate('createdBy', 'fullName email')
        .populate('assignedTo', 'fullName email')
        .populate('participants', 'fullName email');

    return res.status(200).json(new ApiResponse(200, populatedTicket, "Success"));
});

const addReplyToTicket = asyncHandler(async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { content, parentMessageId } = req.body; 
        const { _id: userId, isAdmin } = req.user;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            throw new ApiError(400, "Invalid ticket ID");
        }

    const hasFiles = req.files && Array.isArray(req.files) && req.files.length > 0;
    
    if (!content?.trim() && !hasFiles) {
        throw new ApiError(400, "Message content or attachments are required");
    }

    if (parentMessageId && !mongoose.Types.ObjectId.isValid(parentMessageId)) {
        throw new ApiError(400, "Invalid parent message ID");
    }
    
    if (parentMessageId) {
        const parentMessage = await Message.findOne({ 
            _id: parentMessageId,
            ticketId
        });
        
        if (!parentMessage) {
            throw new ApiError(404, "Parent message not found");
        }
    }

    const ticket = await Ticket.findOne({
        _id: ticketId,
        ...(!isAdmin && { 
            $or: [
                { createdBy: userId },
                { assignedTo: userId },
                { participants: userId }
            ]
        })
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }
    
    const attachmentObjects = [];
    const attachmentUrls = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log(`Processing Attachments: ${req.files.length}`);
        
        try {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                
                if (!fs.existsSync(file.path)) {
                    console.error(`File not found at path: ${file.path}`);
                    continue;
                }
                
                try {
                    const uploadResult = await storeFile(file.path);
                    
                    if (uploadResult) {
                        attachmentObjects.push(uploadResult);
                        attachmentUrls.push(uploadResult.url);
                    }
                } 
                catch (error) {
                    console.error(`Error uploading file ${i+1}:`, error);
                }
                
                try {
                    await clearFile(file.path);
                } 
                catch (error) {
                    console.error(`Error clearing temp file ${file.path}:`, error);
                }
            }
        } 
        catch (error) {
            console.error('Error processing attachments:', error);
        }
    }

    const attachmentUrlStrings = attachmentUrls.map(attachment => {
        if (typeof attachment === 'string') return attachment;
        if (attachment && attachment.url) return attachment.url;
        return String(attachment);
    });
    
    const newMessage = await Message.create({
        content: content?.trim() || (attachmentUrlStrings.length > 0 ? '[Attachment]' : ''),
        ticketId,
        sender: userId,
        isAdminReply: isAdmin,
        parentMessage: parentMessageId || null,
        attachments: attachmentUrlStrings
    });

    if (!parentMessageId) {
        ticket.messages.push(newMessage._id);
        await ticket.save();
    }

    const fullTicket = await Ticket.findById(ticketId)
        .populate('createdBy', 'email fullName')
        .populate('assignedTo', 'fullName email');

    sendTicketReplyNotification(fullTicket, newMessage, req.user)
        .catch(error => console.error('Exception sending reply notification email:', error));
    
    try {
        if (!req.io) {
            console.error('Socket.io instance not available in request');
            return res.status(500).json(new ApiResponse(500, null, 'Socket.io not available'));
        }

        const user = await User.findById(userId).select('fullName isAdmin');
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json(new ApiResponse(404, null, 'User not found'));
        }

        const isAdmin = user.isAdmin;
        
        let recipients = [];
        if (isAdmin) {
            recipients = [ticket.createdBy.toString()];
        } 
        else {
            const admins = await User.find({ isAdmin: true }).select('_id');
            recipients = admins.map(admin => admin._id.toString());
        }
        
        await NotificationService.notifyNewMessage(
            req.io,
            newMessage,
            user.fullName,
            ticket._id.toString(),
            ticket.createdBy.toString(),
            isAdmin
        );
        
    } 
    catch (error) {
        console.error('Failed to send message notification:', error);
    }

    const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'fullName jobRole');
        
    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Reply added successfully")
    );
    } 
    catch (error) {
        console.error('Error in addReplyToTicket:', error);
        return res.status(error.statusCode || 500).json(
            new ApiResponse(
                error.statusCode || 500,
                null,
                error.message || 'Failed to add reply to ticket'
            )
        );
    }
});

const getTicketReplies = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { _id: userId, isAdmin } = req.user;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new ApiError(400, "Invalid ticket ID");
    }

    const ticket = await Ticket.findOne({
        _id: ticketId,
        ...(!isAdmin && { createdBy: userId })
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }

    const topLevelMessages = await Message.find({ 
        ticketId, 
        parentMessage: null
    })
        .sort({ createdAt: 1 })
        .populate('sender', 'fullName jobRole');

    const messagesWithReplies = await Promise.all(
        topLevelMessages.map(async (message) => {
            const replies = await Message.find({ 
                ticketId, 
                parentMessage: message._id 
            })
            .sort({ createdAt: 1 })
            .populate('sender', 'fullName jobRole')
            .lean();
            
            const messageObj = message.toObject();
            messageObj.replies = replies;
            return messageObj;
        })
    );

    return res.status(200).json(new ApiResponse(200, messagesWithReplies, "Ticket replies fetched successfully"));
});

const closeTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { _id: userId, isAdmin } = req.user;
    const { closureNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new ApiError(400, "Invalid ticket ID");
    }

    const query = { 
        _id: ticketId,
        ...(!isAdmin && { createdBy: userId })
    };

    const updatedTicket = await Ticket.findOneAndUpdate(
        query,
        { 
            status: "resolved",
            closedAt: new Date(),
            closedBy: userId,
            closureNote: closureNote || "Ticket closed"
        },
        { new: true, runValidators: true }
    )
    .populate('createdBy', 'fullName email');

    if (!updatedTicket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }

    await Message.create({
        content: `Ticket closed${closureNote ? `: ${closureNote}` : ''}`,
        ticketId,
        sender: userId,
        isAdminReply: isAdmin,
        parentMessage: null
    });

    return res.status(200).json(new ApiResponse(200, updatedTicket, "Ticket closed successfully"));
});

const deleteTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { _id: userId, isAdmin } = req.user;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new ApiError(400, "Invalid ticket ID");
    }

    const query = {
        _id: ticketId,
        ...(!isAdmin && { createdBy: userId })
    };

    const deleteTicket = await Ticket.findOneAndDelete(query);

    if (!deleteTicket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }

    return res.status(200).json(new ApiResponse(200, ticket, "Ticket deleted successfully"));
});

const updateTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { _id: userId, isAdmin } = req.user;
    const { title, content, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new ApiError(400, "Invalid ticket ID");
    }

    if (!title?.trim() || !content?.trim()) {
        throw new ApiError(400, "Title and content are required");
    }

    const existingTicket = await Ticket.findOne({
        _id: ticketId,
        ...(!isAdmin && { createdBy: userId })
    });

    if (!existingTicket) {
        throw new ApiError(404, "Ticket not found or access denied");
    }

    const files = req.files || [];
    let existingAttachments = [];
    try {
        if (req.body.existingAttachments) {
            existingAttachments = JSON.parse(req.body.existingAttachments);
        }
    } 
    catch (error) {
        console.error('Error parsing existingAttachments:', error);
        throw new ApiError(400, "Invalid existingAttachments format");
    }

    let newAttachmentUrls = [];

    if (files.length > 0) {
        try {
            const tempDir = './public/temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file) {
                    console.warn(`Skipping undefined file at index ${i}`);
                    continue;
                }

                if (!file.path || !fs.existsSync(file.path)) {
                    console.error(`File not found at path: ${file.path || 'unknown path'}`);
                    continue;
                }

                try {
                    const uploadResult = await storeFile(file.path);
                    
                    if (uploadResult && uploadResult.url) {
                        newAttachmentUrls.push({
                            url: uploadResult.url,
                            filename: path.basename(uploadResult.url),
                            originalName: file.originalname,
                            mimeType: file.mimetype,
                            size: file.size
                        });
                    } 
                    else {
                        console.error(`Storage failed for file ${i+1}`);
                    }
                } 
                catch (uploadErr) {
                    console.error(`Error uploading file ${i+1}:`, uploadErr);
                } 
                finally {
                    try {
                        await clearFile(file.path);
                    } 
                    catch (err) {
                        console.error(`Failed to clear temp file: ${file.path || 'unknown'}`, err);
                    }
                }
            }
        } 
        catch (error) {
            console.error("Error processing new attachments:", error);
        }
    }

    const updatedAttachments = [...existingAttachments, ...newAttachmentUrls];

    const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        {
            title: title.trim(),
            content: content,
            priority: priority || existingTicket.priority || "Standard",
            attachments: updatedAttachments,
            updatedAt: Date.now()
        },
        { new: true, runValidators: true }
    );

    if (!updatedTicket) {
        throw new ApiError(500, "Failed to update ticket");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedTicket, "Ticket updated successfully")
    );
});

const updateTicketPriority = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { priority } = req.body;
    const { _id: userId, isAdmin } = req.user;
    
    if (!isAdmin) {
        throw new ApiError(403, "Only administrators can update ticket priority");
    }
    
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        throw new ApiError(400, "Invalid ticket ID");
    }
    
    if (!priority || !['Standard', 'High Priority'].includes(priority)) {
        throw new ApiError(400, "Priority must be 'Standard' or 'High Priority'");
    }
    
    const ticket = await Ticket.findById(ticketId)
    .populate('createdBy', 'fullName email')
    .populate('assignedTo', 'fullName email');
    
    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }
    
    const previousPriority = ticket.priority;
    
    ticket.priority = priority;
    await ticket.save({ validateModifiedOnly: true });
    
    const systemMessage = await Message.create({
        ticketId,
        content: `Ticket priority updated from ${previousPriority || 'Standard'} to ${priority}`,
        sender: userId,
        isAdminReply: true,
        isSystemMessage: true
    });
    
    ticket.messages.push(systemMessage._id);
    await ticket.save();
    
    if (ticket.assignedTo) {
        await NotificationService.sendNotification(req.io, {
            recipient: ticket.assignedTo._id,
            title: "Ticket Priority Updated",
            message: `Priority for ticket '${ticket.title}' has been updated to ${priority}`,
            type: "ticket",
            link: `/admin/tickets/${ticketId}`,
            metadata: { ticketId }
        });
    }
    
    await NotificationService.sendNotification(req.io, {
        recipient: ticket.createdBy._id,
        title: "Ticket Priority Updated",
        message: `Priority for your ticket '${ticket.title}' has been updated to ${priority}`,
        type: "ticket",
        link: `/tickets/${ticketId}`,
        metadata: { ticketId }
    });
    
    const populatedTicket = await Ticket.findById(ticketId)
        .populate('createdBy', 'fullName email')
        .populate('assignedTo', 'fullName email')
        .populate('participants', 'fullName email');

    return res.status(200).json(
        new ApiResponse(200, populatedTicket, "Ticket priority updated successfully")
    );
});

const assignTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { adminId } = req.body;
    
    if (!adminId) {
        throw new ApiError(400, "Admin ID is required");
    }
    
    const admin = await User.findById(adminId);
    if (!admin) {
        throw new ApiError(404, "User not found");
    }
    
    if (!admin.isAdmin) {
        throw new ApiError(400, "Only system administrators can be assigned tickets");
    }
    
    const ticket = await Ticket.findById(ticketId).populate('createdBy');
    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }
    
    ticket.assignedTo = adminId;
    await ticket.save({ validateModifiedOnly: true });
    
    const systemMessage = await Message.create({
        ticketId,
        content: `Ticket assigned to admin: ${admin.fullName}`,
        sender: req.user._id,
        isAdminReply: true,
        isSystemMessage: true
    });
    
    ticket.messages.push(systemMessage._id);
    await ticket.save();
    
    const notificationPromises = [];
    
    notificationPromises.push(
        sendTicketAssignmentNotification(ticket, admin)
            .then(result => {
                if (!result.success) {
                    console.error('Failed to send admin assignment email:', result.error);
                } 
                else {
                    console.log(`Assignment notification email sent to admin: ${admin.email}`);
                }
            })
            .catch(error => console.error('Exception sending admin assignment email:', error))
    );
    
    if (ticket.createdBy && ticket.createdBy.email) {
        notificationPromises.push(
            sendTicketOwnerAssignmentNotification(ticket, admin)
                .then(result => {
                    if (!result.success) {
                        console.error('Failed to send ticket owner notification:', result.error);
                    } 
                    else {
                        console.log(`Assignment notification email sent to ticket creator: ${ticket.createdBy.email}`);
                    }
                })
                .catch(error => console.error('Exception sending ticket owner notification email:', error))
        );
    }
    
    notificationPromises.push(
        NotificationService.sendNotification(req.io, {
            recipient: admin._id,
            title: "Ticket Assigned",
            message: `You have been assigned to ticket: ${ticket.title}`,
            type: "ticket",
            link: `/admin/tickets/${ticketId}`,
            metadata: { ticketId }
        }).catch(error => console.error('Failed to send real-time notification:', error))
    );
    
    Promise.allSettled(notificationPromises);
    
    const populatedTicket = await Ticket.findById(ticketId)
        .populate('createdBy', 'fullName email')
        .populate('assignedTo', 'fullName email')
        .populate('participants', 'fullName email');

    return res.status(200).json(
        new ApiResponse(200, populatedTicket, "Ticket assigned successfully")
    );
});

const addParticipant = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { userId } = req.body;
    const { isAdmin, _id: currentUserId } = req.user;

    if (!isAdmin) {
        throw new ApiError(403, "Only admins can add participants to tickets");
    }

    if (!isAdmin) {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket || !ticket.createdBy.equals(currentUserId)) {
            throw new ApiError(403, "You can only add participants to your own tickets");
        }
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid ticket ID or user ID");
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    if (ticket.participants.includes(userId)) {
        throw new ApiError(400, "User is already a participant");
    }

    ticket.participants.push(userId);
    await ticket.save({ validateModifiedOnly: true });

    const updatedTicket = await Ticket.findById(ticketId)
        .populate('createdBy', 'fullName email')
        .populate('assignedTo', 'fullName email')
        .populate('participants', 'fullName email');

    const addedParticipant = updatedTicket.participants.find(p => p._id.toString() === userId);
    
    const notificationPromises = [];
    
    if (addedParticipant && addedParticipant.email) {
        notificationPromises.push(
            sendParticipantAddedNotification(updatedTicket, addedParticipant)
                .then(result => {
                    if (!result.success) {
                        console.error('Failed to send participant notification:', result.error);
                    } 
                    else {
                        console.log(`Participant notification sent to: ${addedParticipant.email}`);
                    }
                })
                .catch(error => console.error('Exception sending participant notification:', error))
        );
    }
    
    if (updatedTicket.createdBy && updatedTicket.createdBy.email && 
        updatedTicket.createdBy._id.toString() !== userId) {
        notificationPromises.push(
            sendTicketOwnerParticipantNotification(updatedTicket, addedParticipant)
                .then(result => {
                    if (!result.success) {
                        console.error('Failed to send creator notification:', result.error);
                    } 
                    else {
                        console.log(`Creator notification sent to: ${updatedTicket.createdBy.email}`);
                    }
                })
                .catch(error => console.error('Exception sending creator notification:', error))
        );
    }
    
    Promise.allSettled(notificationPromises);
    
    console.log(`Participant ${userId} added to ticket ${ticketId}`);

    return res.status(200).json(
        new ApiResponse(200, updatedTicket, "Participant added successfully")
    );
});

const removeParticipant = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { userId } = req.body;
    const { isAdmin, _id: currentUserId } = req.user;

    if (!isAdmin) {
        throw new ApiError(403, "Only admins can remove participants from tickets");
    }

    if (!isAdmin) {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket || !ticket.createdBy.equals(currentUserId)) {
            throw new ApiError(403, "You can only remove participants from your own tickets");
        }
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid ticket ID or user ID");
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    ticket.participants = ticket.participants.filter(
        participantId => !participantId.equals(userId)
    );
    await ticket.save({ validateModifiedOnly: true });

    const updatedTicket = await Ticket.findById(ticketId)
        .populate('createdBy', 'fullName email')
        .populate('assignedTo', 'fullName email')
        .populate('participants', 'fullName email');

    return res.status(200).json(
        new ApiResponse(200, updatedTicket, "Participant removed successfully")
    );
});

export {   
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
};