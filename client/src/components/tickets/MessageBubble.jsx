import { format } from 'date-fns';
import { motion } from 'motion/react';
import { FaUser, FaUserShield } from 'react-icons/fa';
import { config } from '../../config';

const MessageBubble = ({ message, isAdmin, isCurrentUser }) => {
  const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleStyle = isCurrentUser
    ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-bl-2xl rounded-tl-2xl rounded-tr-2xl shadow-md border border-blue-700 dark:border-blue-600 transform hover:scale-[1.02] transition-transform duration-200'
    : isAdmin
    ? 'bg-purple-600 dark:bg-purple-700 text-white rounded-br-2xl rounded-tr-2xl rounded-tl-2xl shadow-md border border-purple-700 dark:border-purple-600'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-br-2xl rounded-tr-2xl rounded-tl-2xl shadow-sm border border-gray-200 dark:border-gray-600';

  const formattedDate = message.createdAt 
    ? format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')
    : 'Just now';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${alignment} my-2 sm:my-3 relative group`}
    >
      <div className="flex max-w-[90%] sm:max-w-[80%] md:max-w-[70%]">
        {!isCurrentUser && (
          <div className="flex-shrink-0 mt-1">
            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 ${isAdmin ? 'bg-purple-100 dark:bg-purple-900' : 'bg-gray-200 dark:bg-gray-600'}`}>
              {isAdmin ? (
                <FaUserShield className="text-purple-600 dark:text-purple-300 text-sm sm:text-lg" />
              ) : (
                <FaUser className="text-gray-600 dark:text-gray-300" />
              )}
            </div>
          </div>
        )}
        
        <div className="max-w-full">
          <div className={`px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base ${bubbleStyle} max-w-full break-words`}>
            <div className="whitespace-pre-wrap">
              {message.content}
            </div>
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1 sm:space-y-2">
                {message.attachments.map((attachment, index) => {
                  let attachmentUrl = '';
                  
                  if (typeof attachment === 'string') {
                    attachmentUrl = attachment;
                  } 
                  else if (attachment && attachment.url) {
                    attachmentUrl = attachment.url;
                  } 
                  else if (attachment && typeof attachment === 'object') {
                    const urlProps = ['url', 'secure_url', 'path'];
                    for (const prop of urlProps) {
                      if (attachment[prop]) {
                        attachmentUrl = attachment[prop];
                        break;
                      }
                    }
                  }

                  if (attachmentUrl && attachmentUrl.startsWith('/')) {
                    attachmentUrl = `${config.API_BASE_URL}${attachmentUrl}`;
                  }
                  
                  let filename = 'attachment-' + (index + 1);
                  
                  if (typeof attachment === 'string') {
                    filename = attachment.split('/').pop();
                  } 
                  else if (attachment && typeof attachment === 'object') {
                    const filenameProps = ['originalName', 'original_filename', 'filename', 'name'];
                    for (const prop of filenameProps) {
                      if (attachment[prop]) {
                        filename = attachment[prop];
                        break;
                      }
                    }
                  }
                  
                  const mimeType = 
                    (attachment && attachment.mimeType) || 
                    (attachment && attachment.mime_type) || 
                    (attachment && attachment.type) || 
                    '';
                    
                  const isImage = 
                    (mimeType && mimeType.startsWith('image/')) ||
                    /\.(jpe?g|png|gif|webp|bmp)$/i.test(filename);
                  return (
                    <a 
                      key={index} 
                      href={attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      title={filename}
                    >
                      {isImage ? (
                        <div className="space-y-1">
                          <img 
                            src={attachmentUrl} 
                            alt={filename}
                            className="max-w-full max-h-[150px] sm:max-h-[200px] h-auto rounded border border-gray-200 dark:border-gray-500 object-contain"
                            onError={(e) => {
                              console.error(`Failed to load image: ${attachmentUrl}`);
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.alt = 'Image failed to load';
                              e.target.className = 'text-xs text-red-500 italic';
                            }}
                          />
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-full">{filename}</div>
                        </div>
                      ) : (
                        <div className="flex items-center p-1 sm:p-2 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
                          <div className="mr-1 sm:mr-2">
                            {/\.pdf$/i.test(attachmentUrl) ? (
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"></path><path d="M3 8a2 2 0 012-2h2.5a1 1 0 010 2H5v10a1 1 0 01-2 0V8z"></path></svg>
                            ) : /\.(doc|docx)$/i.test(attachmentUrl) ? (
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                            ) : /\.(xlsx|xls|csv)$/i.test(attachmentUrl) ? (
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
                            ) : (
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                            )}
                          </div>
                          <div className="flex-1 truncate">
                            <div className="text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">{filename}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Click to open</div>
                          </div>
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className={`text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            {formattedDate} - {message.sender ? (message.sender.fullName || message.sender.name || message.sender.email || 'Unknown') : 'Unknown'}
            {message.sender?.jobRole && (
              <span className="ml-1 italic">({message.sender.jobRole})</span>
            )}
          </div>
        </div>
        
        {isCurrentUser && (
          <div className="flex-shrink-0 mt-1">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center ml-2 sm:ml-3">
              <FaUser className="text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
