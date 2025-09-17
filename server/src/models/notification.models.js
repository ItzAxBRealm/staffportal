import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["ticket", "announcement", "message", "system"],
      default: "system"
    },
    read: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      default: null
    },
    metadata: {
      ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        default: null
      },
      announcementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Announcement",
        default: null
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      }
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
