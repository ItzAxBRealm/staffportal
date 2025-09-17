import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: [true, "You need to provide the content"],
        },
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isAdminReply: {
            type: Boolean,
            default: false,
        },
        parentMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        attachments: [{
            type: String, 
            default: []
        }],
    },
    {
        timestamps: true,
    }
)

messageSchema.index({ ticketId: 1, parentMessage: 1 });

export const Message = mongoose.model("Message", messageSchema);