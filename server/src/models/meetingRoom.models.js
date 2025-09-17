import mongoose from 'mongoose';

const meetingRoomSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Meeting title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        bookedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Booked by user is required']
        },
        startTime: {
            type: Date,
            required: [true, 'Start time is required']
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required']
        },
        status: {
            type: String,
            enum: ['confirmed', 'pending', 'cancelled'],
            default: 'confirmed'
        },
        isRecurring: {
            type: Boolean,
            default: false
        },
        recurringType: {
            type: String,
            enum: ['weekly', 'fortnightly', 'monthly'],
            default: 'weekly'
        },
        recurringWeeks: {
            type: Number,
            default: 1,
            min: 1,
            max: 52
        },
        recurringEndDate: {
            type: Date
        },
        parentBookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MeeitingRoom',
            default: null
        },
        equipment: [{
            type: String,
            trim: true
        }],
        specialRequests: {
            type: String,
            trim: true,
            maxlength: [500, 'Special requests cannot exceed 500 characters']
        },
        isAllDay: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

meetingRoomSchema.index({ startTime: 1, endTime: 1 });
meetingRoomSchema.index({ bookedBy: 1 });
meetingRoomSchema.pre('save', function(next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
    }
    next();
});

meetingRoomSchema.statics.findConflicts = async function(startTime, endTime, excludeId = null) {
    const query = {
        $or: [
            {
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            }
        ]
    };
    
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    
    return await this.find(query);
};

export const MeetingRoom = mongoose.model("MeetingRoom", meetingRoomSchema);
