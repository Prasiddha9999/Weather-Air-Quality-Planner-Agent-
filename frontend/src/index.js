import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// If React root exists, use React; otherwise fallback to static HTML
if (document.getElementById('root')) {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<React.StrictMode><App /></React.StrictMode>);
} else {
  document.body.classList.add('chat-ui');

  const chatMessages = document.getElementById('chatMessages');
  const input = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const API_URL = '/run';
  const SESSION_API_BASE = '/apps/weather_agent/users';
  let sessionId, userId;

  const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  async function createSession() {
    const newSession = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newUser = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    try {
      const res = await fetch(`${SESSION_API_BASE}/${newUser}/sessions/${newSession}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_message: { role: 'user', parts: [{ text: 'Hello' }] } })
      });
      await res.json();
      sessionId = newSession; userId = newUser;
    } catch { sessionId = newSession; userId = newUser; }
  }

  async function init() {
    await createSession();
    addMessage("Hello! I'm your weather and air quality assistant. What would you like to know?", true);
  }

  function addMessage(text, isBot = false) {
    const div = document.createElement('div');
    div.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    const c = document.createElement('div');
    c.className = 'message-content';
    c.innerHTML = isBot
      ? text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>')
      : text;
    div.appendChild(c);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    addMessage(msg, false);
    input.value = '';
    const loading = document.createElement('div');
    loading.className = 'message bot-message';
    loading.innerHTML = '<div class="loading"></div>';
    chatMessages.appendChild(loading);

    try {
      const res = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: 'weather_agent',
          user_id: userId,
          session_id: sessionId,
          new_message: { role: 'user', parts: [{ text: msg }] }
        })
      });
      const data = await res.json();
      loading.remove();
      const reply = Array.isArray(data) ? data[0]?.content?.parts?.[0]?.text : data?.text;
      addMessage(reply || 'No response received.', true);
    } catch (e) {
      console.error('Chat error:', e);
      loading.remove();
      addMessage('Error communicating with server. Please try again.', true);
    }
  }

  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
  init();
}
