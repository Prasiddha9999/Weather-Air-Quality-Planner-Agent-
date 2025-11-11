# Weather & Air Quality Planner 🌤️

A smart AI assistant that provides weather forecasts and air quality information for any location. Built with Google ADK (Agent Development Kit) for easy deployment.

## ✨ Features

- ✅ **Simple weather queries** - "Weather in Kathmandu"
- ✅ **Air quality information** - AQI, PM2.5 with safety recommendations
- ✅ **Clothing recommendations** - Includes air quality for mask guidance
- ✅ **Day comparisons** - "Compare today vs tomorrow for a picnic"
- ✅ **Activity planning** - "Is it safe to run at 6am Sunday?"
- ✅ **Follow-up queries** - Remembers context from previous messages
- ✅ **Automatic date resolution** - Resolves "today", "tomorrow", weekdays automatically
- ✅ **Emoji recommendations** - Visual indicators for weather conditions

---

## 🚀 Quick Setup Guide

Follow these steps to get the project running in minutes!

### Step 1: Prerequisites

Make sure you have these installed:

- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **API Keys** (get these ready):
  - **Google Gemini API Key** - [Get one here](https://makersuite.google.com/app/apikey)
  - **OpenWeatherMap API Key** - [Get one here](https://openweathermap.org/api)

### Step 2: Clone/Download Project

```bash
# If using git
git clone <repository-url>
cd "weather air quality planner"

# Or extract the zip file to a folder
```

### Step 3: Create `.env` File

Create a `.env` file in the project root directory with your API keys:

```env
GOOGLE_API_KEY=your_google_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**💡 Tip:** Replace `your_google_api_key_here` and `your_openweather_api_key_here` with your actual API keys.

### Step 4: Setup Python Environment

**Windows:**
```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install Python dependencies
pip install google-adk python-dotenv httpx
```

**Linux/Mac:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install Python dependencies
pip install google-adk python-dotenv httpx
```

### Step 5: Setup Node.js Dependencies

**Install MCP Server dependencies:**
```bash
cd mcp-server
npm install
cd ..
```

**Install Frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

### Step 6: Run the Application

**Terminal 1 - Start the Backend Server:**
```bash
# Make sure venv is activated
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Start ADK web server
adk web
```

The backend server will start on `http://localhost:8000`

**Terminal 2 - Start the Frontend (Optional but Recommended):**
```bash
cd frontend
npm start
```

The frontend will open at `http://localhost:3000`

**🎉 That's it!** You're ready to use the Weather & Air Quality Planner!

---

## 🏥 Verify Installation

Run the health check to verify everything is set up correctly:

```bash
# Make sure venv is activated
python health.py
```

This will check:
- ✅ Environment variables (API keys)
- ✅ ADK Web Server
- ✅ MCP Server
- ✅ Frontend Server
- ✅ External APIs connectivity

---

## 🖥️ Using the Application

### Option 1: React Chat UI (Recommended)

1. Start both servers (backend and frontend) as shown above
2. Open your browser to `http://localhost:3000`
3. Start chatting! Try: "What's the weather in Kathmandu?"

### Option 2: HTML Chat UI

1. Start the backend server (`adk web`)
2. Open `frontend/chat_ui.html` in your web browser
3. Start chatting!

### Example Queries

Try these to get started:

- **Weather:** "Weather in Kathmandu"
- **Air Quality:** "Is the air quality safe in London today?"
- **Clothing:** "What should I wear in Paris tomorrow morning?"
- **Activities:** "Is it safe to run at 6am Sunday in Kathmandu?"
- **Comparisons:** "Compare today vs tomorrow for a picnic in Kathmandu"

---

## 🔧 Troubleshooting

### Common Issues

**"Module not found" error**
```bash
# Make sure venv is activated and dependencies are installed
pip install google-adk python-dotenv httpx
```

**"adk: command not found" error**
```bash
# Install Google ADK
pip install google-adk

# Verify installation
adk --version
```

**"API key not found" error**
- Check that `.env` file exists in the project root
- Make sure API keys are correct (no extra spaces)
- File should be named exactly `.env` (not `.env.txt`)

**Port 8000 already in use**
- Stop any other services using port 8000
- Or change the port in ADK configuration

**Frontend not loading**
```bash
# Make sure you installed frontend dependencies
cd frontend
npm install
npm start
```

**MCP server issues**
```bash
# Make sure Node.js dependencies are installed
cd mcp-server
npm install
```

### Still Having Issues?

1. Run `python health.py` to diagnose problems
2. Check that all prerequisites are installed
3. Verify your API keys are correct in `.env`
4. Make sure virtual environment is activated
5. Check terminal for error messages

---

## 📁 Project Structure

```
weather air quality planner/
├── weather_agent/          # Python AI agent
│   └── agent.py            # Main agent code
├── mcp-server/             # Node.js MCP server
│   └── index.js            # Weather/AQI API calls
├── frontend/               # React frontend
│   ├── src/                # React source files
│   └── chat_ui.html        # Simple HTML UI
├── health.py               # Health check script
├── .env                    # API keys (create this)
└── README.md               # This file
```

---

## 🏗️ How It Works

```
User Question → ADK Web Server → AI Agent → MCP Tools → External APIs → Response
```

1. **User** asks a question in the chat interface
2. **ADK Web Server** routes the request to the AI agent
3. **AI Agent** (Google Gemini) processes the query and calls MCP tools as needed
4. **MCP Tools** fetch data from:
   - Open-Meteo API (weather data)
   - OpenWeatherMap API (air quality data)
5. **Response** is formatted and returned to the user

---

## 📊 API Data Sources

- **Weather Data**: [Open-Meteo API](https://open-meteo.com/) (free, no API key required)
- **Air Quality Data**: [OpenWeatherMap API](https://openweathermap.org/api) (requires API key)
- **AI Model**: Google Gemini 2.5 Flash (via Google Generative AI)

---

## 🧪 Testing

### Test the Agent Directly

```bash
# Make sure venv is activated
python -m weather_agent.agent
```

### Test with cURL

```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "test",
    "session_id": "test",
    "new_message": {
      "role": "user",
      "parts": [{"text": "Weather in Kathmandu"}]
    }
  }'
```

For more API examples, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## 📚 Additional Documentation

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with examples
- **Health Check**: Run `python health.py` to verify system status

---

## 🎓 Understanding the Code

**Main Files:**
- `weather_agent/agent.py` - AI agent with MCP tool integration
- `mcp-server/index.js` - MCP server for weather/AQI APIs
- `frontend/src/App.js` - React chat interface

**Key Concepts:**
- **ADK (Agent Development Kit)**: Google's framework for building AI agents
- **MCP (Model Context Protocol)**: Protocol for tools that provide context to AI models
- **Session Management**: Conversation history maintained automatically

---

## 📝 License

This project is open source and available for educational purposes.

---

**Need Help?** Run `python health.py` to diagnose issues, or check the Troubleshooting section above.
