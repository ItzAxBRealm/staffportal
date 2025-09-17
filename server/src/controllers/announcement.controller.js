import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Announcement } from '../models/announcement.models.js';
import { logAdminAction } from '../utils/logAdminAction.js';
import NotificationService from '../utils/notificationService.js';
import { User } from '../models/user.models.js';

const getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'fullName');

    return res
        .status(200)
        .json(new ApiResponse(200, announcements, "Announcements fetched"));
});

const getAllAnnouncements = asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }

    const announcements = await Announcement.find()
        .sort({ createdAt: -1 })
        .populate('createdBy', 'fullName');

    return res
        .status(200)
        .json(new ApiResponse(200, announcements, "All announcements fetched"));
});

const createAnnouncement = asyncHandler(async (req, res) => {
    const { title, content, priority } = req.body;
    const { _id: userId } = req.user;

    const isAdmin = req.user.isAdmin;
    
    if (!isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }

    if (!title || !content) {
        throw new ApiError(400, "Title and content are required");
    }

    const announcement = await Announcement.create({
        title: title.trim(),
        content: content.trim(),
        priority: priority || 'normal',
        createdBy: userId
    });

    await logAdminAction({
        adminId: userId,
        action: `Created announcement: ${announcement.title}`,
        details: {
            announcementId: announcement._id,
            priority: announcement.priority,
        }
    });

    try {
        let userQuery = {};
        const users = await User.find(userQuery).select('_id');
        const userIds = users.map(user => user._id.toString());
        
        if (userIds.length > 0) {
            await NotificationService.notifyNewAnnouncement(
                req.io,
                announcement,
                userIds
            );
        }
    } catch (error) {
        console.error('Failed to send announcement notification:', error);
    }

    return res
    .status(201)
    .json(new ApiResponse(201, announcement, "Announcement created"));
});

const updateAnnouncement = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;
    const { title, content, priority } = req.body;
    const { _id: userId } = req.user;
    const isAdmin = req.user.isAdmin;
    
    if (!isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }
    
    const existingAnnouncement = await Announcement.findById(announcementId);
    
    if (!existingAnnouncement) {
        throw new ApiError(404, "Announcement not found");
    }
    
    const updateData = {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(priority && { priority }),
    };

    const announcement = await Announcement.findByIdAndUpdate(
        announcementId,
        updateData,
        { new: true }
    ).populate('createdBy', 'fullName');

    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }

    await logAdminAction({
        adminId,
        action: `Updated announcement: ${announcement.title}`,
        details: {
            announcementId: announcement._id,
            changes: req.body
        }
    });

    return res.status(200).json(new ApiResponse(200, announcement, "Announcement updated"));
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;
    const { _id: userId } = req.user;
    const isAdmin = req.user.isAdmin;
    
    if (!isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }
    const announcement = await Announcement.findById(announcementId);
    
    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }
    await Announcement.findByIdAndDelete(announcementId);

    await logAdminAction({
        adminId: userId,
        action: `Deleted announcement: ${announcement.title}`,
        details: {
            announcementId: announcement._id,
        }
    });

    return res.status(200).json(new ApiResponse(200, {}, "Announcement deleted"));
});

const getAnnouncementCount = asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }
    
    const count = await Announcement.countDocuments({});
    
    return res
        .status(200)
        .json(new ApiResponse(200, { count }, "Announcement count retrieved successfully"));
});

const getAnnouncementById = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;
    
    const announcement = await Announcement.findById(announcementId)
        .populate('createdBy', 'fullName');
    
    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }
    
    return res.status(200).json(new ApiResponse(200, announcement, "Announcement fetched successfully"));
});

export {
    getAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncementCount,
    getAnnouncementById
}