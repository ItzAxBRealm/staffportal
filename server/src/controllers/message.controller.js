import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { storeFile, deleteFile, clearFile } from '../utils/fileStorage.js';
import { Message } from '../models/message.models.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const getMessageById = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { _id: userId, isAdmin } = req.user;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        throw new ApiError(400, "Invalid message ID");
    }

    const message = await Message.findById(messageId)
        .populate('sender', 'fullName jobRole')
        .populate('parentMessage', 'content sender')
        .populate({
            path: 'ticketId',
            select: 'createdBy status attachments',
            populate: {
                path: 'createdBy',
                select: '_id'
            }
        })
        .select("-attachments");

    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    const isAuthorized = isAdmin || 
        message.ticketId.createdBy._id.equals(userId) || 
        message.sender._id.equals(userId);

    if (!isAuthorized) {
        throw new ApiError(403, "Unauthorized to view this message");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, message, "Message retrieved successfully")
        );
});

const updateMessageContent = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const { _id: userId } = req.user;

    const message = await Message.findOneAndUpdate(
        { _id: messageId, sender: userId },
        { content },
        { new: true }
    ).populate('sender', 'fullName jobRole');
    if (!message) throw new ApiError(404, "Message not found or unauthorized");
    return res.json(new ApiResponse(200, message, "Message updated"));
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { _id: userId, isAdmin } = req.user;

    const message = await Message.findOne({
        _id: messageId,
        $or: [
            { sender: userId },
            ...(isAdmin ? [{}] : [])
        ]
    });

    if (!message) throw new ApiError(404, "Message not found or unauthorized");
    await Message.deleteMany({ parentMessage: messageId });
    await Message.findByIdAndDelete(messageId);
    return res.json(new ApiResponse(200, {}, "Message deleted"));
});

const uploadMessageAttachment = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { _id: userId } = req.user;

    if (!req.file) {
        throw new ApiError(400, "Attachment file is required");
    }

    const message = await Message.findOne({
        _id: messageId,
        sender: userId
    });

    if (!message) {
        throw new ApiError(404, "Message not found or unauthorized");
    }

    const attachmentUrl = await storeFile(req.file.path);
    if (!attachmentUrl) {
        throw new ApiError(500, "Failed to upload attachment");
    }

    message.attachments.push(attachmentUrl);
    await message.save();

    return res
        .status(201)
        .json(new ApiResponse(201, { attachmentUrl }, "Attachment added to message"));
});

const deleteMessageAttachment = asyncHandler(async (req, res) => {
    const { messageId, attachmentUrl } = req.params;
    const { _id: userId, isAdmin } = req.user;

    const message = await Message.findOne({
        _id: messageId,
        $or: [
            { sender: userId },
            ...(isAdmin ? [{}] : [])
        ]
    });

    if (!message) {
        throw new ApiError(404, "Message not found or unauthorized");
    }

    try {
        console.log('Message attachment deletion - URL param:', attachmentUrl);
        let filename;
        
        try {
            const urlObj = JSON.parse(attachmentUrl);
            filename = urlObj.url ? urlObj.url.split('/').pop() : null;
        } 
        catch (e) {
            filename = attachmentUrl.split('/').pop();
        }
        
        console.log('Extracted filename for deletion:', filename);
        
        if (filename) {
            await deleteFile(filename);
            console.log(`Deleted message attachment file: ${filename}`);
        } 
        else {
            console.log('Could not extract filename from message attachment URL');
        }

        message.attachments = message.attachments.filter(
            attachment => {
                const attachmentFileName = attachment.url ? attachment.url.split('/').pop() : attachment.split('/').pop();
                return attachmentFileName !== filename;
            }
        );

        await message.save();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Attachment removed from message"));
    } 
    catch (error) {
        console.error("Error deleting attachment:", error);
        return res.status(500).json(new ApiResponse(500, {}, "Failed to delete attachment"));
    }
});

const getMessageThread = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const thread = await Message.find({
        $or: [
            { _id: messageId },
            { parentMessage: messageId }
        ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'fullName jobRole');
    return res.json(new ApiResponse(200, thread, "Thread retrieved"));
});

const toggleMessagePin = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { isAdmin } = req.user;
    if (!isAdmin) throw new ApiError(403, "Admin access required");

    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    message.isPinned = !message.isPinned;
    await message.save();

    return res.json(new ApiResponse(200, message, 
        `Message ${message.isPinned ? 'pinned' : 'unpinned'}`));
});

export {
    getMessageById,
    updateMessageContent,
    deleteMessage,
    uploadMessageAttachment,
    deleteMessageAttachment,
    getMessageThread,
    toggleMessagePin,
}