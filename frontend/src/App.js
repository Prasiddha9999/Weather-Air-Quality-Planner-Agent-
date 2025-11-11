import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  ConversationHeader,
  MessageList,
  Message,
  MessageInput,
  Avatar
} from "@chatscope/chat-ui-kit-react";

const API_URL = '/run';
const SESSION_API_BASE = '/apps/weather_agent/users';

function App() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const hasInitialized = useRef(false);
  const messageListRef = useRef(null);
  const scrollableElementRef = useRef(null);
  const inputRef = useRef(null); // Used in paste handler

  // Scroll to bottom
  const scrollToBottom = () => {
    const selectors = ['.message-list-enhanced', '.cs-message-list', '[class*="message-list"]'];
    let container = scrollableElementRef.current;

    if (!container) {
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) {
          container = el;
          scrollableElementRef.current = el;
          break;
        }
      }
    }

    if (container) {
      container.scrollTop = container.scrollHeight;
      if (container.scrollTo) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Save session to localStorage
  const saveSessionToStorage = (sid, uid, msgs = null) => {
    localStorage.setItem('chat_session_id', sid);
    localStorage.setItem('chat_user_id', uid);
    if (msgs !== null) {
      localStorage.setItem('chat_messages', JSON.stringify(msgs));
    }
    // Log session info to console
    console.log('📝 Session Info:', {
      sessionId: sid,
      userId: uid,
      timestamp: new Date().toISOString()
    });
  };

  // Load session from localStorage
  const loadSessionFromStorage = () => {
    const savedSessionId = localStorage.getItem('chat_session_id');
    const savedUserId = localStorage.getItem('chat_user_id');
    const savedMessages = localStorage.getItem('chat_messages');
    
    if (savedSessionId && savedUserId) {
      setSessionId(savedSessionId);
      setUserId(savedUserId);
      setIsSessionReady(true);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        } catch (e) {
          console.error('Error parsing saved messages:', e);
        }
      }
      // Log session info to console
      console.log('📝 Loaded Session:', {
        sessionId: savedSessionId,
        userId: savedUserId,
        messageCount: savedMessages ? JSON.parse(savedMessages).length : 0
      });
      return true;
    }
    return false;
  };

  // Initialize session
  const createSession = async (clearMessages = false) => {
    const newSessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newUserId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      const res = await fetch(`${SESSION_API_BASE}/${newUserId}/sessions/${newSessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_message: { role: 'user', parts: [{ text: 'Hello' }] } })
      });
      const data = await res.json();
      const id = data.id || newSessionId;
      setSessionId(id);
      setUserId(newUserId);
      setIsSessionReady(true);
      
      if (clearMessages) {
        setMessages([{
          message: "Hello! I'm your weather and air quality assistant. What would you like to know?",
          sender: 'Assistant',
          direction: 'incoming',
          timestamp: getTime()
        }]);
        saveSessionToStorage(id, newUserId, [{
          message: "Hello! I'm your weather and air quality assistant. What would you like to know?",
          sender: 'Assistant',
          direction: 'incoming',
          timestamp: getTime()
        }]);
      } else {
        saveSessionToStorage(id, newUserId);
      }
      
      return true;
    } catch (err) {
      console.error('Session error:', err);
      setSessionId(newSessionId);
      setUserId(newUserId);
      setIsSessionReady(true);
      saveSessionToStorage(newSessionId, newUserId);
      return false;
    }
  };

  // Clear session and create new one
  const handleNewSession = async () => {
    localStorage.removeItem('chat_session_id');
    localStorage.removeItem('chat_user_id');
    localStorage.removeItem('chat_messages');
    console.log('🗑️ Session cleared. Creating new session...');
    await createSession(true);
  };

  // Handle copy events to ensure plain text only
  useEffect(() => {
    const handleCopy = (e) => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        // Get the selected range
        const range = selection.getRangeAt(0);
        
        // Create a temporary container to extract plain text
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(range.cloneContents());
        
        // Extract plain text - this removes all HTML tags and formatting
        let plainText = tempDiv.textContent || tempDiv.innerText || '';
        
        // Clean up: preserve line breaks but normalize whitespace
        // Replace multiple spaces with single space (but keep newlines)
        plainText = plainText.replace(/[ \t]+/g, ' ');
        // Replace multiple newlines with double newline max
        plainText = plainText.replace(/\n{3,}/g, '\n\n');
        // Trim leading/trailing whitespace
        plainText = plainText.trim();
        
        // Clear clipboard and set plain text only
        e.clipboardData.clearData();
        e.clipboardData.setData('text/plain', plainText);
        
        // Prevent default to use our plain text data
        e.preventDefault();
      }
    };

    // Add copy event listener to document
    document.addEventListener('copy', handleCopy);
    
    return () => {
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Try to load existing session from localStorage
      const hasExistingSession = loadSessionFromStorage();
      if (!hasExistingSession) {
        // No existing session, create a new one
        createSession(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle paste events in input to ensure plain text only
  useEffect(() => {
    const handlePaste = (e) => {
      // Get clipboard data
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      // Get pasted content
      let pastedText = clipboardData.getData('text/plain');
      
      // If no plain text, try to extract from HTML
      if (!pastedText) {
        const htmlData = clipboardData.getData('text/html');
        if (htmlData) {
          // Create temporary element to extract text
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlData;
          pastedText = tempDiv.textContent || tempDiv.innerText || '';
        }
      }

      // Clean up the text
      if (pastedText) {
        // Normalize whitespace but preserve line breaks
        pastedText = pastedText.replace(/[ \t]+/g, ' ');
        pastedText = pastedText.replace(/\n{3,}/g, '\n\n');
        pastedText = pastedText.trim();

        // Prevent default paste
        e.preventDefault();

        // Insert plain text at cursor position
        const inputElement = inputRef.current || document.querySelector('.cs-message-input__content-editor');
        if (inputElement) {
          const start = inputElement.selectionStart || 0;
          const end = inputElement.selectionEnd || 0;
          const currentValue = messageInput;
          const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
          setMessageInput(newValue);

          // Set cursor position after pasted text
          setTimeout(() => {
            if (inputElement.setSelectionRange) {
              const newCursorPos = start + pastedText.length;
              inputElement.setSelectionRange(newCursorPos, newCursorPos);
              inputElement.focus();
            }
          }, 0);
        }
      }
    };

    // Find and attach to input element
    const attachPasteHandler = () => {
      const inputElement = document.querySelector('.cs-message-input__content-editor');
      if (inputElement) {
        inputElement.addEventListener('paste', handlePaste);
        inputRef.current = inputElement;
        return true;
      }
      return false;
    };

    // Try to attach immediately
    if (!attachPasteHandler()) {
      // If not found, wait a bit and try again (component might not be mounted yet)
      const timer = setTimeout(() => {
        attachPasteHandler();
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      const inputElement = inputRef.current || document.querySelector('.cs-message-input__content-editor');
      if (inputElement) {
        inputElement.removeEventListener('paste', handlePaste);
      }
    };
  }, [messageInput]);

  // Auto-scroll
  useLayoutEffect(scrollToBottom, [messages.length, isLoading]);
  useEffect(() => {
    const observer = new MutationObserver(scrollToBottom);
    const container = document.querySelector('.cs-message-list');
    if (container) observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Process backend response
  const processResponse = (data) => {
    if (data === null || data === undefined) {
      setMessages((m) => [...m, {
        message: "I'm having trouble processing your request right now. Please try again later.",
        sender: 'Assistant',
        direction: 'incoming',
        timestamp: getTime()
      }]);
      return;
    }

    let text = '';
    try {
      if (Array.isArray(data) && data[0]?.content?.parts?.[0]?.text) {
        text = data[0].content.parts[0].text;
      } else if (data?.content?.parts?.[0]?.text) {
        text = data.content.parts[0].text;
      } else if (data?.text) {
        text = data.text;
      } else if (typeof data === 'string') {
        text = data;
      }

      if (text === null || text === undefined) text = '';
      text = String(text).trim();
    } catch (error) {
      console.error('Error processing response:', error);
      text = '';
    }

    const msg = {
      message: text || "I'm having trouble processing your request right now. Please try again later.",
      sender: 'Assistant',
      direction: 'incoming',
      timestamp: getTime()
    };
    setMessages((m) => {
      const updated = [...m, msg];
      // Save messages to localStorage
      localStorage.setItem('chat_messages', JSON.stringify(updated));
      return updated;
    });
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !isSessionReady || isLoading) return;

    const input = messageInput.trim();
    const userMsg = { message: input, sender: 'User', direction: 'outgoing', timestamp: getTime() };
    setMessages((m) => {
      const updated = [...m, userMsg];
      // Save messages to localStorage
      localStorage.setItem('chat_messages', JSON.stringify(updated));
      return updated;
    });
    setMessageInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const req = {
        app_name: 'weather_agent',
        user_id: userId,
        session_id: sessionId,
        new_message: { role: 'user', parts: [{ text: input }] }
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });

      if (!res.ok) {
        let errorMsg = `HTTP error! status: ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData.detail || errorData.error || errorData.message) {
            errorMsg += ` - ${errorData.detail || errorData.error || errorData.message}`;
          }
        } catch {
          errorMsg += ` - ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      processResponse(await res.json());
    } catch (e) {
      console.error('Send error:', e);
      
      let errorMessageText = "I'm having trouble processing your request right now. Please try again later.";
      
      if (e.message) {
        if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.message.includes('network')) {
          errorMessageText = "Network error. Please check your connection and try again later.";
        } else if (e.message.includes('429') || e.message.includes('rate limit') || e.message.includes('quota')) {
          errorMessageText = "Response generation is temporarily limited due to API rate limits. Please try again in a moment.";
        } else if (e.message.includes('5')) {
          errorMessageText = "Server error. Please try again later.";
        } else if (e.message.length < 100) {
          errorMessageText = `Sorry, there was an error: ${e.message}. Please try again.`;
        }
      }
      
      setMessages((m) => {
        const updated = [...m, {
          message: errorMessageText,
          sender: 'Assistant',
          direction: 'incoming',
          timestamp: getTime()
        }];
        // Save messages to localStorage
        localStorage.setItem('chat_messages', JSON.stringify(updated));
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse message content - extract sources and format
  const parseMessage = (text) => {
    if (!text || typeof text !== 'string') {
      return { mainContent: String(text || ''), sources: null };
    }

    let cleanedText = text;
    
    // Remove code blocks
    cleanedText = cleanedText
      .replace(/```[\s\S]*?```/g, '')
      .replace(/```\w*\n?/g, '')
      .replace(/\n?```/g, '');
    
    // Remove inline code
    cleanedText = cleanedText.replace(/`[^`]*`/g, '');
    cleanedText = cleanedText.replace(/`/g, '');
    
    // Extract sources section - handle multiple formats
    let sources = null;
    const sourcesPatterns = [
      /(Sources?:[\s\S]*)$/i,           // "Sources:" or "Source:"
      /(Source:[\s\S]*)$/i,              // "Source:"
      /(Data from:[\s\S]*)$/i,           // "Data from:"
      /(References?:[\s\S]*)$/i,         // "References:" or "Reference:"
      /(API sources?:[\s\S]*)$/i,        // "API sources:" or "API source:"
    ];
    
    for (const pattern of sourcesPatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        sources = match[0].trim();
        // Clean up markdown formatting
        sources = sources
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/`/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep text
          .trim();
        cleanedText = cleanedText.substring(0, match.index).trim();
        break;
      }
    }
    
    // Clean up
    cleanedText = cleanedText
      .replace(/^[`"]+/g, '')
      .replace(/[`"]+$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n+$/, '')
      .trim();
    
    return { mainContent: cleanedText, sources: sources };
  };

  // Format message with weather data highlighting
  const formatMessage = (text) => {
    if (!text || typeof text !== 'string') {
      return String(text || '');
    }

    const { mainContent, sources } = parseMessage(text);
    
    // Split by lines to process weather data lines
    const lines = mainContent.split('\n');
    const processedLines = lines.map(line => {
      const trimmedLine = line.trim();
      const isWeatherData = 
        /°C/.test(trimmedLine) || 
        /Air quality:/i.test(trimmedLine) || 
        /PM2\.5|PM10|µg\/m³/.test(trimmedLine) ||
        /^\w+.*:\s*\d+.*°C/.test(trimmedLine) ||
        (/Tomorrow|Today|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Morning|Afternoon|Evening/.test(trimmedLine) && 
         (/°C|temperature|wind|precipitation|light winds|moderate|strong/i.test(trimmedLine) || /\d+[–-]\d+°C/.test(trimmedLine)));
      
      if (isWeatherData && trimmedLine) {
        return `<span class="weather-data-line">${trimmedLine}</span>`;
      }
      return trimmedLine;
    });
    
    let formatted = processedLines.join('<br>');
    
    // Format markdown
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Add sources if present - format nicely in one line
    if (sources) {
      // Format sources with better structure
      let formattedSources = sources
        .replace(/^(Sources?|Source|Data from|References?|API sources?):\s*/i, '')
        .trim();
      
      // Check for the two standard sources in the text
      const standardSources = ['Open-Meteo API', 'OpenWeatherMap API'];
      const foundSources = [];
      
      // Check if each standard source appears in the text (case-insensitive, flexible matching)
      standardSources.forEach(source => {
        const sourceLower = source.toLowerCase().replace(/[-\s]/g, '');
        const textLower = formattedSources.toLowerCase().replace(/[-\s]/g, '');
        if (textLower.includes(sourceLower)) {
          foundSources.push(source);
        }
      });
      
      // Use found standard sources, or fallback to original text
      if (foundSources.length > 0) {
        formattedSources = foundSources.join(', ');
      } else {
        // Split by common separators (but preserve hyphens in words like "Open-Meteo")
        // Split by commas, newlines, or bullet points, but not by hyphens
        const sourceItems = formattedSources
          .split(/[,\n•*]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        if (sourceItems.length > 0) {
          formattedSources = sourceItems.join(', ');
        }
      }
      
      formatted += `<div class="message-sources-inside"><strong>Sources:</strong> ${formattedSources}</div>`;
    }
    
    return formatted;
  };

  return (
    <div className="app-container">
      <MainContainer className="main-container-enhanced" responsive>
        <ChatContainer>
          <ConversationHeader className="chat-header-enhanced">
            <ConversationHeader.Content userName="Weather and Air Quality Assistant" />
            <ConversationHeader.Actions>
              <button 
                onClick={handleNewSession}
                className="new-session-button"
                title="Start New Session"
                disabled={isLoading}
              >
                New Session
              </button>
            </ConversationHeader.Actions>
          </ConversationHeader>

          <MessageList ref={messageListRef} className="message-list-enhanced">
            {messages.map((msg, i) => {
              const formattedContent = formatMessage(msg.message);
              const contentWithTimestamp = formattedContent + 
                (msg.timestamp ? `<div class="message-timestamp-outside message-timestamp-${msg.direction}">${msg.timestamp}</div>` : '');
              
              return (
                <Message
                  key={i}
                  model={{ 
                    message: contentWithTimestamp, 
                    sender: msg.sender, 
                    direction: msg.direction,
                    position: 'single'
                  }}
                  className={`message-animated message-${msg.direction} message-with-timestamp`}
                  data-timestamp={msg.timestamp || undefined}
                  data-timestamp-dir={msg.direction}
                >
                  {msg.direction === 'incoming' && (
                    <Avatar>
                      <div className="avatar-placeholder">🌤️</div>
                    </Avatar>
                  )}
                </Message>
              );
            })}
            {isLoading && (
              <Message 
                model={{ 
                  message: '<div class="typing-dots-animated"><span>.</span><span>.</span><span>.</span></div>', 
                  sender: 'Assistant', 
                  direction: 'incoming',
                  position: 'single'
                }}
                className="message-animated message-incoming"
              >
                <Avatar>
                  <div className="avatar-placeholder">🌤️</div>
                </Avatar>
              </Message>
            )}
          </MessageList>

          <MessageInput
            placeholder={isSessionReady ? "Ask about weather or air quality..." : "Initializing session..."}
            disabled={isLoading || !isSessionReady}
            onSend={sendMessage}
            onChange={setMessageInput}
            value={messageInput}
            attachButton={false}
            sendButton={true}
            className="message-input-enhanced"
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default App;
