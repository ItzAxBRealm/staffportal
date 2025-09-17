import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
    {
        question: { 
            type: String, 
            required: true 
        },
        answer: { 
            type: String, 
            required: true 
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true,
    }
);

export const FAQ = mongoose.model("FAQ", faqSchema);