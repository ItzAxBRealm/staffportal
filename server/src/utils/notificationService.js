import { createNotification } from "../controllers/notification.controller.js";
import { User } from '../models/user.models.js';

class NotificationService {
  static #userCache = new Map(); 
  static #rateLimiters = new Map(); 
  static #failedNotifications = new Set(); 
  static #retryQueue = []; 
  
  static #RATE_LIMIT_WINDOW = 60000;
  static #RATE_LIMIT_MAX = 50; 
  static #RETRY_ATTEMPTS = 3;
  static #RETRY_DELAY = 5000; 
  
  static initialize() {
    setInterval(() => {
      this.#cleanupCache();
    }, 600000);
    
    setInterval(() => {
      this.#processRetryQueue();
    }, 30000);
    
    console.log('[NotificationService] Service initialized with cleanup intervals');
  }
  
  static #cleanupCache() {
    const now = Date.now();
    
    for (const [userId, limiter] of this.#rateLimiters) {
      if (now - limiter.resetTime > this.#RATE_LIMIT_WINDOW) {
        this.#rateLimiters.delete(userId);
      }
    }
    
    for (const [userId, cacheEntry] of this.#userCache) {
      if (now - cacheEntry.timestamp > 1800000) { 
        this.#userCache.delete(userId);
      }
    }
    
    console.log(`[NotificationService] Cache cleanup completed. Active rate limiters: ${this.#rateLimiters.size}, Cached users: ${this.#userCache.size}`);
  }
  
  static #isRateLimited(userId) {
    const now = Date.now();
    const limiter = this.#rateLimiters.get(userId);
    
    if (!limiter) {
      this.#rateLimiters.set(userId, {
        count: 1,
        resetTime: now
      });
      return false;
    }
    
    if (now - limiter.resetTime > this.#RATE_LIMIT_WINDOW) {
      limiter.count = 1;
      limiter.resetTime = now;
      return false;
    }
    
    if (limiter.count >= this.#RATE_LIMIT_MAX) {
      console.warn(`[NotificationService] Rate limit exceeded for user ${userId}: ${limiter.count}/${this.#RATE_LIMIT_MAX}`);
      return true;
    }
    
    limiter.count++;
    return false;
  }
  
  static async #getCachedUser(userId) {
    const cached = this.#userCache.get(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < 300000)) {
      return cached.data;
    }
    
    try {
      const user = await User.findById(userId).select('_id username email isAdmin preferences.notifications').lean();
      if (user) {
        this.#userCache.set(userId, {
          data: user,
          timestamp: now
        });
      }
      return user;
    } 
    catch (error) {
      console.error(`[NotificationService] Error fetching user ${userId}:`, error);
      return cached?.data || null; 
    }
  }
  
  static #validateNotificationOptions(options) {
    const errors = [];
    
    if (!options.recipient) {
      errors.push('Recipient is required');
    }
    
    if (!options.message && !options.title) {
      errors.push('Either message or title is required');
    }
    
    if (!options.type) {
      errors.push('Notification type is required');
    }
    
    const validTypes = ['ticket', 'announcement', 'message', 'system', 'success', 'error', 'warning', 'info'];
    if (options.type && !validTypes.includes(options.type)) {
      errors.push(`Invalid notification type: ${options.type}. Valid types: ${validTypes.join(', ')}`);
    }
    return errors;
  }
  
  static async #processRetryQueue() {
    if (this.#retryQueue.length === 0) return;
    console.log(`[NotificationService] Processing retry queue: ${this.#retryQueue.length} items`);
    const itemsToRetry = this.#retryQueue.splice(0, 10); 
    
    for (const item of itemsToRetry) {
      try {
        if (item.attempts >= this.#RETRY_ATTEMPTS) {
          console.error(`[NotificationService] Max retry attempts reached for notification:`, item.options);
          continue;
        }
        
        const result = await this.sendNotification(item.io, item.options);
        if (!result) {
          this.#retryQueue.push({
            ...item,
            attempts: item.attempts + 1
          });
        } 
        else {
          console.log(`[NotificationService] Successfully retried notification after ${item.attempts} attempts`);
        }
      } 
      catch (error) {
        console.error(`[NotificationService] Error during retry:`, error);
        if (item.attempts < this.#RETRY_ATTEMPTS) {
          this.#retryQueue.push({
            ...item,
            attempts: item.attempts + 1
          });
        }
      }
    }
  }
  
  static async sendNotification(io, options) {
    const startTime = Date.now();
    
    try {
      if (!io) {
        console.error('[NotificationService] Socket.io instance not provided');
        return null;
      }
      
      const validationErrors = this.#validateNotificationOptions(options);
      if (validationErrors.length > 0) {
        console.error('[NotificationService] Validation errors:', validationErrors);
        return null;
      }
      
      const recipients = Array.isArray(options.recipient) 
        ? options.recipient 
        : [options.recipient];
      
      console.log('[NotificationService] Creating notification:', {
        recipients: recipients.length,
        type: options.type,
        hasMetadata: !!options.metadata
      });
      
      const results = [];
      
      for (const recipientId of recipients) {
        try {
          if (this.#isRateLimited(recipientId)) {
            console.warn(`[NotificationService] Rate limited notification for user ${recipientId}`);
            continue;
          }
          
          const user = await this.#getCachedUser(recipientId);
          if (!user) {
            console.warn(`[NotificationService] User not found: ${recipientId}`);
            continue;
          }
          
          const userPrefs = user.preferences?.notifications;
          if (userPrefs && userPrefs[options.type] === false) {
            console.log(`[NotificationService] User ${recipientId} has disabled ${options.type} notifications`);
            continue;
          }
          
          const notificationData = {
            ...options,
            recipient: recipientId
          };
          
          const notification = await createNotification(notificationData);
          
          if (!notification) {
            console.error(`[NotificationService] Failed to create notification in database for user ${recipientId}`);
            continue;
          }
          
          const clientNotification = {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            read: notification.read,
            timestamp: notification.createdAt,
            ...(notification.metadata || {})
          };
          
          const roomName = `user_${recipientId}`;
          const rooms = io.sockets?.adapter?.rooms;
          const roomExists = rooms?.has(roomName);
          
          if (roomExists) {
            const events = [
              'notification',
              `${options.type}Notification`,
              'newNotification'
            ];
            
            let emitSuccess = false;
            for (const eventName of events) {
              try {
                io.to(roomName).emit(eventName, clientNotification);
                emitSuccess = true;
              } 
              catch (emitError) {
                console.error(`[NotificationService] Error emitting ${eventName}:`, emitError);
              }
            }
            
            if (emitSuccess) {
              console.log(`[NotificationService] Successfully emitted to ${roomName}`, {
                notificationId: notification._id,
                type: options.type
              });
              results.push(clientNotification);
            }
          } 
          else {
            console.warn(`[NotificationService] No active connections for user ${recipientId}`);
            results.push(clientNotification);
          }
          
        } 
        catch (error) {
          console.error(`[NotificationService] Error processing notification for user ${recipientId}:`, error);
          
          if (this.#isRetriableError(error)) {
            this.#retryQueue.push({
              io,
              options: { ...options, recipient: recipientId },
              attempts: 1,
              timestamp: Date.now()
            });
          }
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`[NotificationService] Completed notification processing in ${duration}ms. Success: ${results.length}/${recipients.length}`);
      return results.length > 0 ? (results.length === 1 ? results[0] : results) : null;
    } 
    catch (error) {
      console.error('[NotificationService] Critical error in sendNotification:', error);
      return null;
    }
  }
  
  static #isRetriableError(error) {
    const retriableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED'
    ];
    
    return retriableErrors.some(code => 
      error.code === code || 
      error.message.includes(code) ||
      error.name === 'MongoNetworkError' ||
      error.name === 'MongoTimeoutError'
    );
  }
  
  static async broadcastNotification(io, recipients, notificationData) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      console.warn('[NotificationService] No recipients provided for broadcast');
      return [];
    }
    console.log(`[NotificationService] Broadcasting to ${recipients.length} recipients`);
    const batchSize = 50;
    const results = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      console.log(`[NotificationService] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(recipients.length/batchSize)}`);
      
      const batchPromises = batch.map(recipient => 
        this.sendNotification(io, {
          ...notificationData,
          recipient
        }).catch(error => {
          console.error(`[NotificationService] Batch error for recipient ${recipient}:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
      );
      
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    console.log(`[NotificationService] Broadcast completed. Success: ${results.length}/${recipients.length}`);
    return results;
  }
  
  static async notifyNewTicket(io, ticket, creatorName) {
    try {
      if (!io || !ticket) {
        throw new Error('Missing required parameters for notifyNewTicket');
      }

      console.log(`[NotificationService] Processing new ticket notification: ${ticket._id}`);
      const adminUsers = await User.find({ isAdmin: true })
        .select('_id username preferences.notifications')
        .lean();
      
      if (adminUsers.length === 0) {
        console.warn('[NotificationService] No admin users found for ticket notification');
        return [];
      }

      const adminIds = adminUsers
        .filter(admin => admin.preferences?.notifications?.ticket !== false)
        .map(admin => admin._id.toString());

      if (adminIds.length === 0) {
        console.log('[NotificationService] All admins have disabled ticket notifications');
        return [];
      }
      console.log(`[NotificationService] Notifying ${adminIds.length} admins about new ticket`);
      const notificationData = {
        title: 'New Ticket Created',
        message: `${creatorName} created: ${ticket.title}`,
        type: 'ticket',
        link: `/admin/tickets/${ticket._id}`,
        metadata: {
          ticketId: ticket._id.toString(),
          createdBy: ticket.createdBy.toString(),
          priority: ticket.priority,
          category: ticket.category
        }
      };
      return await this.broadcastNotification(io, adminIds, notificationData);
    } 
    catch (error) {
      console.error('[NotificationService] Error in notifyNewTicket:', error);
      return [];
    }
  }

  static async notifyNewMessage(io, message, senderName, ticketId, ticketCreatorId, isAdminReply) {
    const context = {
      messageId: message?._id,
      ticketId,
      ticketCreatorId,
      isAdminReply,
      senderName
    };
    
    console.log('[NotificationService] Processing new message notification:', context);

    try {
      if (!io || !message || !ticketId || !ticketCreatorId) {
        throw new Error('Missing required parameters for notifyNewMessage');
      }

      let recipients = [];
      let notificationData = {};

      if (isAdminReply) {
        const ticketCreator = await this.#getCachedUser(ticketCreatorId);
        if (!ticketCreator) {
          console.warn(`[NotificationService] Ticket creator not found: ${ticketCreatorId}`);
          return [];
        }
        
        if (ticketCreator.preferences?.notifications?.message === false) {
          console.log(`[NotificationService] User ${ticketCreatorId} has disabled message notifications`);
          return [];
        }
        
        recipients = [ticketCreatorId];
        notificationData = {
          title: 'New Reply from Support',
          message: `Support replied: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
          type: 'message',
          link: `/tickets/${ticketId}`,
          metadata: {
            ticketId,
            senderId: message.sender?.toString(),
            isAdminReply: true,
            messageId: message._id?.toString()
          }
        };  
      } 
      else {
        const adminUsers = await User.find({ isAdmin: true })
          .select('_id preferences.notifications')
          .lean();
        
        recipients = adminUsers
          .filter(admin => admin.preferences?.notifications?.ticket !== false)
          .map(admin => admin._id.toString());
        
        if (recipients.length === 0) {
          console.log('[NotificationService] No admins available for ticket reply notification');
          return [];
        }
        
        notificationData = {
          title: 'New Ticket Reply',
          message: `${senderName} replied: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
          type: 'ticket',
          link: `/admin/tickets/${ticketId}`,
          metadata: {
            ticketId,
            senderId: message.sender?.toString(),
            isAdminReply: false,
            messageId: message._id?.toString()
          }
        };
      }

      if (recipients.length === 0) {
        console.warn('[NotificationService] No recipients for message notification');
        return [];
      }
      console.log(`[NotificationService] Sending message notification to ${recipients.length} recipients`);
      return await this.broadcastNotification(io, recipients, notificationData);
    } 
    catch (error) {
      console.error('[NotificationService] Error in notifyNewMessage:', error);
      return [];
    }
  }
  
  static async notifyNewAnnouncement(io, announcement, userIds = null) {
    try {
      console.log('[NotificationService] Processing announcement notification:', {
        announcementId: announcement._id,
        hasUserIds: !!userIds,
        userCount: userIds?.length
      });
      
      let recipients = userIds;
      
      if (!recipients) {
        const users = await User.find({ 
          isActive: { $ne: false },
          'preferences.notifications.announcement': { $ne: false }
        }).select('_id').lean();
        
        recipients = users.map(user => user._id.toString());
      } 
      else {
        const users = await User.find({
          _id: { $in: recipients },
          'preferences.notifications.announcement': { $ne: false }
        }).select('_id').lean();
        recipients = users.map(user => user._id.toString());
      }

      if (recipients.length === 0) {
        console.log('[NotificationService] No recipients for announcement notification');
        return [];
      }
      
      const notificationData = {
        title: 'New Announcement',
        message: announcement.title,
        type: 'announcement',
        link: `/announcements/${announcement._id}`,
        metadata: {
          announcementId: announcement._id.toString(),
          senderId: announcement.creator?.toString(),
          priority: announcement.priority
        }
      };
      
      console.log(`[NotificationService] Broadcasting announcement to ${recipients.length} users`);
      return await this.broadcastNotification(io, recipients, notificationData);
    } 
    catch (error) {
      console.error('[NotificationService] Error in notifyNewAnnouncement:', error);
      return [];
    }
  }
  
  static getStats() {
    return {
      cachedUsers: this.#userCache.size,
      activeRateLimiters: this.#rateLimiters.size,
      retryQueueSize: this.#retryQueue.size,
      failedNotifications: this.#failedNotifications.size
    };
  }
  
  static clearCaches() {
    this.#userCache.clear();
    this.#rateLimiters.clear();
    this.#retryQueue.length = 0;
    this.#failedNotifications.clear();
    console.log('[NotificationService] All caches cleared');
  }
}

export default NotificationService;