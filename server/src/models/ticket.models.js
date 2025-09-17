import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            unique: true,
            required: true
        },
        title: {
            type: String,
            required: [true, "A title is required"]
        },
        content: {
            type: String,
            required: [true, "You need to provide the content."]
        },
        status: {
            type: String,
            enum: ["open", "in-progress", "resolved"],
            default: "open"
        },
        priority: {
            type: String,
            enum: ["Standard", "High Priority"],
            default: "Standard"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        attachments: [
            {
                type: mongoose.Schema.Types.Mixed,
            }
        ],
        messages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        }],
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
    },
    {
        timestamps: true,
    }
)

export const Ticket = mongoose.model("Ticket", ticketSchema);