import { AuditLog } from "../models/auditLog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const logAdminAction = asyncHandler(async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function (body) {
    const responseBody = JSON.parse(body);
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.isAdmin) {
      const actionMap = {
        POST: "create",
        PUT: "edit",
        PATCH: "edit",
        DELETE: "delete"
      };
      
      let entityType = "unknown";
      if (req.path.includes("/tickets")) entityType = "ticket";
      if (req.path.includes("/announcements")) entityType = "announcement";
      if (req.path.includes("/faqs")) entityType = "faq";
      if (req.path.includes("/users")) entityType = "user";
      
      const entityId = responseBody?.data?._id || req.params.ticketId || req.params.announcementId || req.params.faqId || req.params.userId;
      
      if (entityId) {
        AuditLog.create({
          action: actionMap[req.method] || "status_change",
          adminId: req.user._id,
          entityType,
          entityId,
          metadata: {
            url: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            timestamp: new Date()
          }
        }).catch(err => console.error("Audit log error:", err));
      }
    }
     
    originalSend.call(this, body);
    return res;
  };
  
  next();
});