import { AuditLog } from '../models/auditLog.models.js';

export const logAdminAction = async ({ adminId, action, entityType, entityId, details }) => {
  try {
    console.log("Logging admin action - original values:", { adminId, action, entityType, entityId, details });
    let correctedAction;
    let correctedEntityType;
    let correctedEntityId;
    
    if (action) {
      if (action.toLowerCase().includes('created') || action.toLowerCase().includes('create')) {
        correctedAction = 'create';
      } 
      else if (action.toLowerCase().includes('edited') || action.toLowerCase().includes('update')) {
        correctedAction = 'edit';
      } 
      else if (action.toLowerCase().includes('deleted') || action.toLowerCase().includes('delete')) {
        correctedAction = 'delete';
      } 
      else if (action.toLowerCase().includes('status')) {
        correctedAction = 'status_change';
      } 
      else {
        if (['create', 'edit', 'delete', 'status_change'].includes(action)) {
          correctedAction = action;
        } 
        else {
          console.log(`Unknown action type: ${action}, defaulting to create`);
          correctedAction = 'create';
        }
      }
    } 
    else {
      correctedAction = 'create'; 
    }
    
    correctedEntityType = entityType;
    if (!correctedEntityType) {
      if (action && action.toLowerCase().includes('announcement')) {
        correctedEntityType = 'announcement';
      } 
      else if (action && action.toLowerCase().includes('ticket')) {
        correctedEntityType = 'ticket';
      } 
      else if (action && action.toLowerCase().includes('faq')) {
        correctedEntityType = 'faq';
      } 
      else if (action && action.toLowerCase().includes('user')) {
        correctedEntityType = 'user';
      } 
      else if (details && details.announcementId) {
        correctedEntityType = 'announcement';
      } 
      else if (details && details.ticketId) {
        correctedEntityType = 'ticket';
      } 
      else if (details && details.faqId) {
        correctedEntityType = 'faq';
      } 
      else if (details && details.userId) {
        correctedEntityType = 'user';
      } 
      else {
        correctedEntityType = 'announcement';
      }
    }
    
    correctedEntityId = entityId;
    if (!correctedEntityId && details) {
      if (details.announcementId) correctedEntityId = details.announcementId;
      else if (details.ticketId) correctedEntityId = details.ticketId;
      else if (details.faqId) correctedEntityId = details.faqId;
      else if (details.userId) correctedEntityId = details.userId;
    }
    
    console.log("Creating audit log with corrected values:", { 
      adminId, 
      action: correctedAction, 
      entityType: correctedEntityType, 
      entityId: correctedEntityId 
    });
    
    await AuditLog.create({ 
      adminId, 
      action: correctedAction, 
      entityType: correctedEntityType, 
      entityId: correctedEntityId 
    });
    
  } 
  catch (error) {
    console.error("Audit log failed:", error.message);
  }
};