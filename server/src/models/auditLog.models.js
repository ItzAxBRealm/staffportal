import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            enum: ["create", "edit", "delete", "status_change"],
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        entityType: {
            type: String,
            required: true,
            enum: ["ticket", "announcement", "faq", "user"],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);