import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { FAQ } from '../models/faq.models.js';
import { logAdminAction } from '../utils/logAdminAction.js';

const getAllFAQs = asyncHandler(async (req, res) => {
    const faqs = await FAQ.find({})
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, faqs, "FAQs fetched successfully"));
});

const createFAQ = asyncHandler(async (req, res) => {
    const { question, answer, category } = req.body;
    const { _id: adminId } = req.user;

    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }

    if (!question || !answer) {
        throw new ApiError(400, "Question and answer are required");
    }

    const faq = await FAQ.create({
        question: question.trim(),
        answer: answer.trim(),
        category: category?.trim(),
        createdBy: adminId
    });

    await logAdminAction({
        adminId,
        action: `Created FAQ: ${faq.question}`,
        details: {
            faqId: faq._id,
            category: faq.category
        }
    });

    return res.status(201).json(new ApiResponse(201, faq, "FAQ created successfully"));
});

const updateFAQ = asyncHandler(async (req, res) => {
    const { faqId } = req.params;
    const { question, answer, category } = req.body;
    const { _id: adminId } = req.user;

    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }

    const faq = await FAQ.findByIdAndUpdate(
        faqId,
        {
            question: question?.trim(),
            answer: answer?.trim(),
            category: category?.trim()
        },
        { new: true }
    );

    if (!faq) {
        throw new ApiError(404, "FAQ not found");
    }

    await logAdminAction({
        adminId,
        action: `Updated FAQ: ${faq.question}`,
        details: {
            faqId: faq._id,
            changes: req.body
        }
    });

    return res.status(200).json(new ApiResponse(200, faq, "FAQ updated successfully"));
});

const deleteFAQ = asyncHandler(async (req, res) => {
    const { faqId } = req.params;
    const { _id: adminId } = req.user;
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }

    const faq = await FAQ.findByIdAndDelete(faqId);

    if (!faq) {
        throw new ApiError(404, "FAQ not found");
    }

    await logAdminAction({
        adminId,
        action: `Deleted FAQ: ${faq.question}`,
        details: {
            faqId: faq._id,
            category: faq.category
        }
    });

    return res.status(200).json(new ApiResponse(200, {}, "FAQ deleted successfully"));
});

const getFAQCount = asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }
    const count = await FAQ.countDocuments({});
    return res
    .status(200)
    .json(new ApiResponse(200, { count }, "FAQ count retrieved successfully"));
});

export {
    getAllFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    getFAQCount
}