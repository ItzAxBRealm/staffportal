import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { FAQ } from "../models/faq.models.js";
import { Announcement } from "../models/announcement.models.js";
import { Ticket } from "../models/ticket.models.js";

const getAdminStats = asyncHandler(async (req, res) => {
  const [userCount, faqCount, announcementCount, ticketCount] = await Promise.all([
    User.countDocuments(),
    FAQ.countDocuments(),
    Announcement.countDocuments(),
    Ticket.countDocuments()
  ]);
  
  return res.status(200).json(
    new ApiResponse(200, {
      users: userCount,
      faqs: faqCount,
      announcements: announcementCount,
      tickets: ticketCount
    }, "Admin statistics retrieved successfully")
  );
});

export {
  getAdminStats
};
