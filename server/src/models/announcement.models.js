import mongoose from "mongoose";


const announcementSchema = new mongoose.Schema(
    {
        title: { 
            type: String, 
            required: [true, 'Title is required'] 
        },
        content: {
            type: String, 
            required: [true, 'Content is required'] 
        },
        createdBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        priority: {
            type: String,
            enum: ['normal', 'high'],
            default: 'normal'
        },
    },
    {
        timestamps: true,
    }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);