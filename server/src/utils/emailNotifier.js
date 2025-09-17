import nodemailer from 'nodemailer';

let transporterReady = false;
const emailUser = process.env.SMTP_USER;
const emailPassword = process.env.SMTP_PASSWORD;
const emailHost = process.env.SMTP_HOST; 
const emailPort = parseInt(process.env.SMTP_PORT );

if (!emailHost || !emailUser || !emailPassword) {
  console.warn('⚠️ SMTP configuration incomplete. Will use mock email transport.');
  console.warn('Missing:', !emailHost ? 'SMTP_HOST' : '', !emailUser ? 'SMTP_USER' : '', !emailPassword ? 'SMTP_PASSWORD' : '');
}

console.log('Setting up email with:', {
  host: emailHost,
  port: emailPort,
  hasUser: !!emailUser,
  hasPassword: !!emailPassword
});

const transportConfig = {
  host: emailHost,
  port: emailPort,
  auth: {
    user: emailUser,
    pass: emailPassword
  },
  secure: emailPort === 465,
  requireTLS: emailPort === 587, 
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',   
    ciphers: 'SSLv3'            
  },
  debug: true                   
};

const transporter = nodemailer.createTransport(transportConfig);

const mockTransporter = {
  sendMail: (mailOptions) => {
    console.log('MOCK EMAIL NOT SENT');
    console.log('  To:', mailOptions.to);
    console.log('  Subject:', mailOptions.subject);
    console.log('  Content preview:', mailOptions.html?.substring(0, 100) + '...');
    return Promise.resolve({ 
      response: 'Email sending skipped - using mock transport',
      messageId: `mock-${Date.now()}`
    });
  },
  verify: (callback) => callback(null, true)
};

transporter.verify((error, success) => {
  if (error) {
    console.error('Email connection error:', error);
    transporterReady = false;
    console.log('Using mock email transport - emails will NOT be sent');
  } 
  else {
    console.log('Email server connection verified successfully!');
    transporterReady = true;
  }
});

export { transporter, transporterReady, sendEmail };

async function sendEmail(mailOptions) {
    if (!mailOptions.from) {
        mailOptions.from = `"Staff Portal" <${'no-reply@yourcompany.com.au'}>`;
    }
    
    if (!mailOptions.to) {
        const error = 'No recipient email provided';
        console.error(error, mailOptions.subject);
        return { success: false, error };
    }

    if (!mailOptions.replyTo && process.env.ADMIN_EMAIL) {
        mailOptions.replyTo = process.env.ADMIN_EMAIL;
    }

    try {
        console.log(`Sending email: "${mailOptions.subject}" to ${mailOptions.to}`);
        console.log(`From: ${mailOptions.from}`);
        console.log(`Using transporter: ${transporterReady ? 'Mailguard SMTP' : 'Mock'}`);
        
        const activeTransporter = transporterReady ? transporter : mockTransporter;
        
        const info = await activeTransporter.sendMail(mailOptions);
        
        console.log(`Email sent successfully: ${info.messageId || 'No message ID'}`);
        console.log(`Email sent successfully!`);
        console.log(`Server Response: ${info.response || 'No Response'}`);
        
        return { 
            success: true, 
            messageId: info.messageId,
            response: info.response 
        };
    } 
    catch (error) {
        console.error('⚠️ Failed to send email:', error.message);
        console.error('Email that failed:', {
            to: mailOptions.to,
            subject: mailOptions.subject
        });
        
        let errorDetails = 'Unknown error';
        
        if (error.code === 'EAUTH') {
            errorDetails = 'Authentication failed - check your username and password';
        } 
        else if (error.code === 'ESOCKET') {
            errorDetails = 'Socket error - check your host and port settings';
        } 
        else if (error.code === 'ETIMEDOUT') {
            errorDetails = 'Connection timed out - check your network settings or firewall';
        } 
        else if (error.code === 'ECONNREFUSED') {
            errorDetails = 'Connection refused - verify SMTP server address and port';
        }
        console.error(`Email error details: ${errorDetails}`);
        
        return { 
            success: false, 
            error: error.message,
            errorCode: error.code,
            errorDetails
        };
    }
}

export const sendTicketReplyNotification = async (ticket, message) => {
    if (!ticket || !message) {
        console.error('Missing ticket or message data for reply notification');
        return { success: false, error: 'Missing ticket or message data' };
    }

    const recipientEmail = message.isAdminReply 
        ? ticket.createdBy?.email 
        : process.env.ADMIN_EMAIL;

    if (!recipientEmail) {
        console.error('No recipient email found for ticket reply notification');
        return { success: false, error: 'No recipient email found' };
    }

    return await sendEmail({
        to: recipientEmail,
        subject: `New reply on Ticket #${ticket.ticketId}`,
        html: `
            <h2>New reply on your ticket</h2>
            <p><strong>Ticket:</strong> ${ticket.title}</p>
            <p><strong>Message:</strong> ${message.content}</p>
            <p><strong>Sender:</strong> ${message.sender?.fullName || 'Staff Member'}</p>
            <p><a href="${process.env.FRONTEND_URL}/tickets/${ticket._id}">View Ticket</a></p>
        `
    });
}

export const sendTicketAssignmentNotification = async (ticket, admin) => {
    if (!ticket || !admin) {
        console.error('Missing ticket or admin data for assignment notification');
        return { success: false, error: 'Missing ticket or admin data' };
    }
    
    if (!admin.email) {
        console.error('No admin email provided for ticket assignment notification');
        return { success: false, error: 'No admin email provided' };
    }

    return await sendEmail({
        to: admin.email,
        subject: `Ticket Assignment #${ticket.ticketId}: ${ticket.title}`,
        html: `
            <h2>You have been assigned a ticket</h2>
            <p><strong>Ticket:</strong> ${ticket.title}</p>
            <p><strong>Content:</strong> ${ticket.content}</p>
            <p><strong>Created by:</strong> ${ticket.createdBy?.fullName || 'A staff member'}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><a href="${process.env.FRONTEND_URL}/admin/tickets/${ticket._id}">View Ticket</a></p>
            <p>Please address this ticket at your earliest convenience.</p>
        `
    });
};

export const sendTicketOwnerAssignmentNotification = async (ticket, admin) => {
    if (!ticket || !admin) {
        console.error('Missing ticket or admin data for owner assignment notification');
        return { success: false, error: 'Missing ticket or admin data' };
    }
    
    if (!ticket.createdBy?.email) {
        console.error('No ticket owner email found, skipping notification');
        return { success: false, error: 'No ticket owner email found' };
    }

    return await sendEmail({
        to: ticket.createdBy.email,
        subject: `Your Ticket #${ticket.ticketId} has been assigned: ${ticket.title}`,
        html: `
            <h2>Your ticket has been assigned to an admin</h2>
            <p><strong>Ticket:</strong> ${ticket.title}</p>
            <p><strong>Assigned to:</strong> ${admin.fullName}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p>Your ticket is now being handled by ${admin.fullName} and will be addressed soon.</p>
            <p><a href="${process.env.FRONTEND_URL}/tickets/${ticket._id}">View Ticket</a></p>
        `
    });
};

export const sendTicketStatusChangeNotification = async (ticket, previousStatus) => {
    if (!ticket) {
        console.error('Missing ticket data for status change notification');
        return { success: false, error: 'Missing ticket data' };
    }
    
    if (!ticket.createdBy?.email) {
        console.error('No ticket owner email found, skipping notification');
        return { success: false, error: 'No ticket owner email found' };
    }

    const statusMap = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
    };

    const formattedPreviousStatus = statusMap[previousStatus] || previousStatus;
    const formattedCurrentStatus = statusMap[ticket.status] || ticket.status;

    return await sendEmail({
        to: ticket.createdBy.email,
        subject: `Ticket #${ticket.ticketId} Status Update: ${ticket.title}`,
        html: `
            <h2>Your ticket status has been updated</h2>
            <p><strong>Ticket:</strong> ${ticket.title}</p>
            <p><strong>Previous status:</strong> ${formattedPreviousStatus}</p>
            <p><strong>New status:</strong> ${formattedCurrentStatus}</p>
            ${ticket.assignedTo && ticket.assignedTo.fullName ? `<p><strong>Assigned to:</strong> ${ticket.assignedTo.fullName}</p>` : ''}
            <p><a href="${process.env.FRONTEND_URL}/tickets/${ticket._id}">View Ticket</a></p>
        `
    });
};

export const sendNewTicketNotification = async (ticket) => {
    if (!ticket) {
        console.error('Missing ticket data for new ticket notification');
        return { success: false, error: 'Missing ticket data' };
    }
    
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.error('No admin email configured for new ticket notifications');
        return { success: false, error: 'No admin email configured' };
    }

    const priorityBadge = ticket.priority === 'High Priority' 
        ? '<span style="background-color: #dc3545; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">HIGH PRIORITY</span>'
        : '<span style="background-color: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">STANDARD</span>';
    

    return await sendEmail({
        to: adminEmail,
        subject: `🎫 New Ticket #${ticket.ticketId} Created: ${ticket.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">🎫 New Ticket Requires Allocation</h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #007bff;">Ticket Details</h3>
                    <p><strong>Ticket ID:</strong> #${ticket.ticketId}</p>
                    <p><strong>Title:</strong> ${ticket.title}</p>
                    <p><strong>Content:</strong> ${ticket.content}</p>
                    <p><strong>Priority:</strong> ${priorityBadge}</p>
                    <p><strong>Created by:</strong> ${ticket.createdBy?.fullName || 'A staff member'}</p>
                    <p><strong>Status:</strong> <span style="background-color: #17a2b8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">OPEN</span></p>
                    <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString('en-AU', { 
                        timeZone: 'Australia/Sydney',
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/admin/tickets/${ticket._id}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        📋 View & Assign Ticket
                    </a>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404;"><strong>⚠️ Action Required:</strong> This ticket needs to be assigned to a system administrator for resolution.</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="color: #6c757d; font-size: 14px; text-align: center;">
                    This is an automated notification from the Staff Portal system.<br>
                    Please do not reply to this email.
                </p>
            </div>
        `
    });
};

export const testEmailConfiguration = async (recipient) => {
    if (!recipient) {
        console.error('No recipient email provided for test');
        return { success: false, error: 'No recipient email provided' };
    }
    
    const emailConfig = {
        host: emailHost,
        port: emailPort,
        secure: true,
        hasCredentials: !!emailUser && !!emailPassword,
        transporterReady: transporterReady,
        replyTo: process.env.ADMIN_EMAIL || 'Not set',
        frontendUrl: process.env.FRONTEND_URL || 'Not set',
        nodeEnv: process.env.NODE_ENV || 'Not set'
    };
    
    console.log('Running email configuration test...', emailConfig);
    
    const result = await sendEmail({
        to: recipient,
        subject: `Email Configuration Test - ${new Date().toLocaleString()}`,
        html: `
            <h2>Email Configuration Test</h2>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Server:</strong> ${emailHost}:${emailPort}</p>
            <p><strong>From:</strong> ${emailUser}</p>
            <p><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || 'Not set'}</p>
            <hr>
            <p>If you received this email, your configuration is working correctly!</p>
        `
    });
    
    return {
        ...result,
        emailConfig
    };
};

export const sendParticipantAddedNotification = async (ticket, participant) => {
    if (!ticket || !participant) {
        console.error('Missing ticket or participant data for notification');
        return { success: false, error: 'Missing ticket or participant data' };
    }

    const mailOptions = {
        from: ` Staff Portal" <${emailUser}>`,
        to: participant.email,
        subject: `You've been added as a participant to ticket #${ticket.ticketId}: ${ticket.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">You've Been Added as a Participant</h2>
                <p>Hello ${participant.fullName},</p>
                <p>You have been added as a participant to the following ticket:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Ticket Details</h3>
                    <p><strong>Title:</strong> ${ticket.title}</p>
                    <p><strong>Status:</strong> ${ticket.status}</p>
                    <p><strong>Priority:</strong> ${ticket.priority}</p>
                    <p><strong>Created by:</strong> ${ticket.createdBy?.fullName || 'Unknown'}</p>
                </div>
                
                <p>As a participant, you can now:</p>
                <ul>
                    <li>View the ticket details and conversation history</li>
                    <li>Add replies and comments</li>
                    <li>Receive notifications about updates</li>
                </ul>
                
                <p>You can access this ticket by logging into the Staff Portal.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                    This is an automated notification from the Staff Portal.
                </p>
            </div>
        `
    };

    return await sendEmail(mailOptions);
};

export const sendTicketOwnerParticipantNotification = async (ticket, participant) => {
    if (!ticket || !participant || !ticket.createdBy) {
        console.error('Missing ticket, participant, or creator data for notification');
        return { success: false, error: 'Missing required data' };
    }

    const mailOptions = {
        from: `"Staff Portal" <${emailUser}>`,
        to: ticket.createdBy.email,
        subject: `New participant added to your ticket #${ticket.ticketId}: ${ticket.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Participant Added to Your Ticket</h2>
                <p>Hello ${ticket.createdBy.fullName},</p>
                <p>A new participant has been added to your ticket:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Ticket Details</h3>
                    <p><strong>Title:</strong> ${ticket.title}</p>
                    <p><strong>Status:</strong> ${ticket.status}</p>
                    <p><strong>Priority:</strong> ${ticket.priority}</p>
                    <p><strong>New Participant:</strong> ${participant.fullName}</p>
                </div>
                
                <p>The participant can now view and contribute to your ticket conversation.</p>
                
                <p>You can view your ticket by logging into the Staff Portal.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                    This is an automated notification from the Staff Portal.
                </p>
            </div>
        `
    };

    return await sendEmail(mailOptions);
};