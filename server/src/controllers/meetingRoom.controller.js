import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { MeetingRoom } from '../models/meetingRoom.models.js';
import { User } from '../models/user.models.js';
import { logAdminAction } from '../utils/logAdminAction.js';
import NotificationService from '../utils/notificationService.js';

const getBookings = asyncHandler(async (req, res) => {
    const { 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
    } = req.query;

    let query = {};
    
    if (startDate || endDate) {
        query.startTime = {};
        if (startDate) {
            query.startTime.$gte = new Date(startDate);
        }
        if (endDate) {
            query.startTime.$lte = new Date(endDate);
        }
    }

    const skip = (page - 1) * limit;
    const bookings = await MeetingRoom.find(query)
        .populate('bookedBy', 'fullName email')
        .populate('createdBy', 'fullName email')
        .populate('lastModifiedBy', 'fullName email')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await MeetingRoom.countDocuments(query);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            bookings,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalBookings: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        }, "Bookings fetched successfully"));
});

const getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const booking = await MeetingRoom.findById(id)
        .populate('bookedBy', 'fullName email phoneNumber')
        .populate('createdBy', 'fullName email')
        .populate('lastModifiedBy', 'fullName email');

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    if (!req.user.isAdmin && 
        booking.bookedBy._id.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Unauthorized to view this booking");
    }

    return res.status(200).json(new ApiResponse(200, booking, "Booking fetched successfully"));
});

const getBookingsByUserEmail = asyncHandler(async (req, res) => {
    const { email, limit = 20 } = req.query;
    
    if (!email) {
        throw new ApiError(400, "Email parameter is required");
    }
    
    const user = await User.findOne({ email }).select('_id fullName');
    
    if (!user) {
        return res
        .status(200)
        .json(new ApiResponse(200, [], "No user found with this email"));
    }
    
    const bookings = await MeetingRoom.find({ 
        bookedBy: user._id 
    })
    .populate('bookedBy', 'fullName email')
    .populate('createdBy', 'fullName email')
    .sort({ startTime: -1 })
    .limit(parseInt(limit));
    
    return res
    .status(200)
    .json(new ApiResponse(200, bookings, `Found ${bookings.length} booking(s) for ${email}`));
});

const createBooking = asyncHandler(async (req, res) => {
    const {
        title,
        startTime,
        endTime,
        isRecurring = false,
        recurringType = 'weekly',
        recurringWeeks = 1,
        recurringEndDate,
        equipment,
        specialRequests,
        isAllDay = false
    } = req.body;

    if (!title || !startTime || !endTime) {
        throw new ApiError(400, "Title, start time, and end time are required");
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    if (end <= start) {
        throw new ApiError(400, "End time must be after start time");
    }

    const conflicts = await MeetingRoom.findConflicts(start, end);
    if (conflicts.length > 0) {
        throw new ApiError(409, "Time slot conflicts with existing booking", conflicts);
    }

    const bookingData = {
        title,
        bookedBy: req.user._id,
        startTime: start,
        endTime: end,
        isRecurring,
        recurringType,
        recurringWeeks: parseInt(recurringWeeks),
        equipment: equipment || [],
        specialRequests,
        isAllDay,
        createdBy: req.user._id
    };

    if (isRecurring && recurringEndDate) {
        bookingData.recurringEndDate = new Date(recurringEndDate);
    }

    let createdBookings = [];
    if (isRecurring) {
        const parentBooking = await MeetingRoom.create(bookingData);
        createdBookings.push(parentBooking);

        let currentStart = new Date(start);
        let currentEnd = new Date(end);
        const numberOfRecurrences = parseInt(recurringWeeks) - 1; 

        for (let i = 0; i < numberOfRecurrences; i++) {
            if (recurringType === 'weekly') {
                currentStart.setDate(currentStart.getDate() + 7);
                currentEnd.setDate(currentEnd.getDate() + 7); 
            } 
            else if (recurringType === 'fortnightly') {
                currentStart.setDate(currentStart.getDate() + 14);
                currentEnd.setDate(currentEnd.getDate() + 14);
            } 
            else if (recurringType === 'monthly') {
                currentStart.setMonth(currentStart.getMonth() + 1);
                currentEnd.setMonth(currentEnd.getMonth() + 1);
            }

            const recurringConflicts = await MeetingRoom.findConflicts(currentStart, currentEnd);
            if (recurringConflicts.length === 0) {
                const recurringBooking = await MeetingRoom.create({
                    ...bookingData,
                    startTime: new Date(currentStart),
                    endTime: new Date(currentEnd),
                    parentBookingId: parentBooking._id
                });
                createdBookings.push(recurringBooking);
            }
        }
    } 
    else {
        const booking = await MeetingRoom.create(bookingData);
        createdBookings.push(booking);
    }

    const populatedBookings = await MeetingRoom.find({
        _id: { $in: createdBookings.map(b => b._id) }
    })
    .populate('bookedBy', 'fullName email')
    .populate('createdBy', 'fullName email');

    if (req.user.isAdmin) {
        await logAdminAction(req.user._id, 'create', 'MeetingRoom', createdBookings[0]._id, {
            title,
            startTime: start,
            endTime: end,
            isRecurring
        });
    }
    return res
    .status(201)
    .json(new ApiResponse(201, populatedBookings, `${createdBookings.length} booking(s) created successfully`));
});

const updateBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const booking = await MeetingRoom.findById(id);
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const canEdit = req.user.isAdmin || booking.bookedBy.toString() === req.user._id.toString();

    if (!canEdit) {
        throw new ApiError(403, "Unauthorized to update this booking");
    }

    if (updateData.startTime || updateData.endTime) {
        const newStart = updateData.startTime ? new Date(updateData.startTime) : booking.startTime;
        const newEnd = updateData.endTime ? new Date(updateData.endTime) : booking.endTime;

        if (newEnd <= newStart) {
            throw new ApiError(400, "End time must be after start time");
        }

        const conflicts = await MeetingRoom.findConflicts(newStart, newEnd, id);
        if (conflicts.length > 0) {
            throw new ApiError(409, "Time slot conflicts with existing booking", conflicts);
        }
    }

    updateData.lastModifiedBy = req.user._id;
    const updatedBooking = await MeetingRoom.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    )
    .populate('bookedBy', 'fullName email')
    .populate('createdBy', 'fullName email')
    .populate('lastModifiedBy', 'fullName email');

    if (req.user.isAdmin) {
        await logAdminAction(req.user._id, 'update', 'MeetingRoom', id, updateData);
    }

    try {
        await NotificationService.sendBookingNotification(updatedBooking, 'updated');
    } 
    catch (error) {
        console.error('Failed to send booking notification:', error);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedBooking, "Booking updated successfully"));
});

const deleteBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deleteRecurring = false } = req.query;
    const booking = await MeetingRoom.findById(id);
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const canDelete = req.user.isAdmin || booking.bookedBy.toString() === req.user._id.toString();

    if (!canDelete) {
        throw new ApiError(403, "Unauthorized to delete this booking");
    }

    let deletedCount = 0;

    if (deleteRecurring && booking.isRecurring) {
        if (booking.parentBookingId) {
            await MeetingRoom.deleteMany({
                $or: [
                    { parentBookingId: booking.parentBookingId },
                    { _id: booking.parentBookingId }
                ]
            });
            deletedCount = await MeetingRoom.countDocuments({
                $or: [
                    { parentBookingId: booking.parentBookingId },
                    { _id: booking.parentBookingId }
                ]
            });
        } 
        else {
            await MeetingRoom.deleteMany({
                $or: [
                    { parentBookingId: id },
                    { _id: id }
                ]
            });
            deletedCount = await MeetingRoom.countDocuments({
                $or: [
                    { parentBookingId: id },
                    { _id: id }
                ]
            });
        }
    } 
    else {
        await MeetingRoom.findByIdAndDelete(id);
        deletedCount = 1;
    }

    if (req.user.isAdmin) {
        await logAdminAction(req.user._id, 'delete', 'MeetingRoom', id, {
            title: booking.title,
            deleteRecurring
        });
    }

    try {
        await NotificationService.sendBookingNotification(booking, 'cancelled');
    } 
    catch (error) {
        console.error('Failed to send booking notification:', error);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, { deletedCount }, `${deletedCount} booking(s) deleted successfully`));
});

const getUserBookings = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { upcoming = true, page = 1, limit = 20 } = req.query;

    if (userId !== req.user._id.toString() && !req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized to view these bookings");
    }
    let query = { bookedBy: userId };
    
    if (upcoming === 'true') {
        query.startTime = { $gte: new Date() };
        query.status = { $ne: 'cancelled' };
    }

    const skip = (page - 1) * limit;
    
    const bookings = await MeetingRoom.find(query)
        .populate('bookedBy', 'fullName email')
        .sort({ startTime: upcoming === 'true' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await MeetingRoom.countDocuments(query);
    return res
        .status(200)
        .json(new ApiResponse(200, {
            bookings,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalBookings: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        }, "User bookings fetched successfully"));
});

const checkAvailability = asyncHandler(async (req, res) => {
    const { startTime, endTime, excludeId } = req.query;

    if (!startTime || !endTime) {
        throw new ApiError(400, "Start time and end time are required");
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    if (end <= start) {
        throw new ApiError(400, "End time must be after start time");
    }

    const conflicts = await MeetingRoom.findConflicts(start, end, excludeId);
    
    return res
        .status(200)
        .json(new ApiResponse(200, {
            available: conflicts.length === 0,
            conflicts: conflicts.map(booking => ({
                id: booking._id,
                title: booking.title,
                startTime: booking.startTime,
                endTime: booking.endTime,
                bookedBy: booking.bookedBy
            }))
        }, "Availability checked"));
});

export {
    getBookings,
    getBookingById,
    getBookingsByUserEmail,
    createBooking,
    updateBooking,
    deleteBooking,
    getUserBookings,
    checkAvailability
};
