import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.models.js";

const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const includeRead = req.query.includeRead === 'true';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  let sinceFilter = {};
  if (req.query.since) {
    try {
      const sinceDate = new Date(req.query.since);
      if (isNaN(sinceDate.getTime())) {
        console.error('Invalid date format received:', req.query.since);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        sinceFilter = { createdAt: { $gte: sevenDaysAgo } };
      }
      else if (sinceDate > new Date()) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        sinceFilter = { createdAt: { $gte: sevenDaysAgo } };
      } 
      else {
        sinceFilter = { createdAt: { $gte: sinceDate } };
      }
    } 
    catch (error) {
      console.error('Error processing since parameter:', req.query.since, error);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      sinceFilter = { createdAt: { $gte: sevenDaysAgo } };
    }
  }
  
  const query = { 
    recipient: userId,
    ...(!includeRead ? { read: false } : {}),
    ...sinceFilter
  };
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);
  
  return res.status(200).json(
    new ApiResponse(200, {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total
      }
    }, "Notifications retrieved successfully")
  );
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  const notification = await Notification.findById(notificationId);
  
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  
  if (notification.recipient.toString() !== userId.toString()) {
    throw new ApiError(403, "You don't have permission to update this notification");
  }
  
  notification.read = true;
  await notification.save();
  
  return res.status(200).json(
    new ApiResponse(200, notification, "Notification marked as read")
  );
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  await Notification.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );
  
  return res.status(200).json(
    new ApiResponse(200, {}, "All notifications marked as read")
  );
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  console.log(`Attempting to delete notification: ${notificationId} for user: ${userId}`);
  
  if (!notificationId || notificationId === 'undefined' || notificationId === 'null') {
    throw new ApiError(400, "Invalid notification ID");
  }
  
  const notification = await Notification.findById(notificationId);
  
  if (!notification) {
    console.log(`Notification not found: ${notificationId}`);
    throw new ApiError(404, "Notification not found");
  }
  
  if (notification.recipient.toString() !== userId.toString()) {
    console.log(`Permission denied. Notification recipient: ${notification.recipient}, User: ${userId}`);
    throw new ApiError(403, "You don't have permission to delete this notification");
  }
  
  await notification.deleteOne();
  console.log(`Successfully deleted notification: ${notificationId}`);
  
  return res.status(200).json(
    new ApiResponse(200, {}, "Notification deleted successfully")
  );
});

const createNotification = async (options) => {
  try {
    const { recipient, title, message, type, link, metadata } = options;
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
      metadata
    });
    
    return notification;
  } 
  catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

const getNotificationById = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  const notification = await Notification.findById(notificationId);
  
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  
  if (notification.recipient.toString() !== userId.toString()) {
    throw new ApiError(403, "You don't have permission to view this notification");
  }
  
  return res.status(200).json(
    new ApiResponse(200, notification, "Notification retrieved successfully")
  );
});

const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await Notification.deleteMany({ recipient: userId });
  
  return res.status(200).json(
    new ApiResponse(200, { deleted: result.deletedCount }, "All notifications deleted successfully")
  );
});

export {
  getUserNotifications,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification
};
