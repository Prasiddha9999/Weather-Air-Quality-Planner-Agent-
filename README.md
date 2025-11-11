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
- ✅ **Reference date support** - Set custom reference dates for testing
- ✅ **Emoji recommendations** - Visual indicators for weather conditions
- ✅ **Conversation history** - Maintains context across messages (via ADK)

## 🎯 Quick Start

### Prerequisites

Before starting, make sure you have:

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- **OpenWeatherMap API Key** ([Get one here](https://openweathermap.org/api))

### Installation Steps

#### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd "weather air quality planner"

# Or just extract the zip file to a folder
```

#### 2. Create Environment File

Create a `.env` file in the project root with your API keys:

```env
GOOGLE_API_KEY=your_google_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**How to get API keys:**
- **Google Gemini API Key**: Go to [Google AI Studio](https://makersuite.google.com/app/apikey) and create a new key
- **OpenWeatherMap API Key**: Sign up at [OpenWeatherMap](https://openweathermap.org/api) and get your key from the dashboard

#### 3. Setup Python Environment

**Windows:**
```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install google-adk python-dotenv
```

**Linux/Mac:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install google-adk python-dotenv
```

#### 4. Setup Node.js Dependencies

**MCP Server:**
```bash
cd mcp-server
npm install
cd ..
```

**Frontend (React Chat UI with ChatScope):**
```bash
cd frontend
npm install
# This will install ChatScope UI kit and other dependencies
cd ..
```

**Note:** The frontend uses [ChatScope UI Kit](https://chatscope.io/) for the chat interface. The installation includes:
- `@chatscope/chat-ui-kit-react` - React components for chat UI
- `@chatscope/chat-ui-kit-styles` - Styles for ChatScope components

#### 5. Run the Application

```bash
# Make sure venv is activated
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Run ADK web server
adk web
```

The server will start on `http://localhost:8000` by default.

**Note:** If you get a port conflict error (port 8000 already in use), stop any other services using that port or specify a different port.

---

## 🖥️ Using the Chat Interface

### Option 1: React Chat UI (Recommended)

The React chat UI uses **ChatScope UI Kit** for a beautiful, modern chat interface.

1. **Start the ADK server** (as shown above)
2. **Open a new terminal and navigate to frontend folder:**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   This will install all dependencies including:
   - `@chatscope/chat-ui-kit-react` - Chat UI components
   - `@chatscope/chat-ui-kit-styles` - Chat UI styles
3. The React app will open at `http://localhost:3000`

**Features:**
- Modern, responsive chat interface
- Smooth animations and transitions
- Markdown support in messages
- Auto-scrolling message list
- Loading indicators

### Option 2: HTML Chat UI

1. **Start the ADK server** (as shown above)
2. **Open `frontend/chat_ui.html`** in your web browser

Both UIs maintain your session ID until you refresh the page.

---

## 📁 Project Structure

```
weather air quality planner/
├── weather_agent/             # Python AI agent package
│   ├── __init__.py            # Package exports
│   └── agent.py               # Main agent (ADK Agent instance)
│       ├── MCPServer          # MCP client wrapper
│       ├── root_agent         # ADK Agent instance
│       └── SYSTEM_PROMPT      # Agent instructions
├── agent/                     # Legacy directory (contains mcp_client.py)
│   └── mcp_client.py          # MCP client implementation
├── mcp-server/                # Node.js MCP server
│   ├── index.js               # MCP server (API calls)
│   └── package.json           # Node.js dependencies
├── frontend/                  # Frontend UI files
│   ├── src/                   # React source files
│   │   ├── App.js             # Main React component
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Styles
│   ├── public/                # Public assets
│   │   └── index.html         # HTML template
│   ├── chat_ui.html           # Simple HTML chat interface
│   └── package.json           # React dependencies
├── API_DOCUMENTATION.md       # Detailed API documentation
├── README.md                  # This file
└── .env                       # API keys (create this)
```

---

## 🏗️ Architecture

### How It Works

```
┌──────────────────┐
│    ADK Web       │
│  (Google ADK)    │
└────────┬─────────┘
         │
         │   Routes to
         │
┌────────▼───────────────┐
│   root_agent           │
│  (ADK Agent Instance)  │
│  • Uses SYSTEM_PROMPT  │
│  • Auto date resolution│
│  • MCP tool integration│
└────────┬───────────────┘
         │
┌────────▼───────────────┐
│      MCPServer         │
│  • get_weather()       │
│  • get_air_quality()   │
└────────┬───────────────┘
         │
┌────────▼───────────────┐
│   External APIs        │
│  • Open-Meteo (Weather)│
│  • OpenWeatherMap (AQI)│
└────────────────────────┘
```

### Request Flow

1. **User Input** → User types a question in the chat interface
   - Example: "What should I wear in Kathmandu tomorrow morning?"

2. **ADK Web** → Routes request to `root_agent` (ADK Agent instance)
   - ADK Web handles routing and session management automatically
   - **Session ID** is maintained by ADK

3. **Agent Processing** → `root_agent` processes the query:
   - Uses Google Gemini 2.5 Flash model
   - Automatically resolves relative dates ("today", "tomorrow", etc.) using `get_current_datetime()`
   - Uses SYSTEM_PROMPT for instructions
   - Calls MCP tools as needed

4. **MCP Tools** → MCPServer calls external APIs:
   - **get_weather()**: Fetches from Open-Meteo API (temperature, rain, wind)
   - **get_air_quality()**: Fetches from OpenWeatherMap API (AQI, PM2.5)

5. **Response Generation** → Gemini formats the response:
   - Creates natural, user-friendly answers
   - Uses resolved date (e.g., "Monday, November 10, 2025") instead of relative terms
   - Includes emoji recommendations (🌤️, ☔, 😷, 🏃, 👕)
   - Follows structured format from SYSTEM_PROMPT

6. **Response** → Returns formatted answer to the user
   - Example: "Monday, November 11, 2025 in Kathmandu: Temperatures will range from 21–23°C, with a gentle breeze of 6 kph from the west. No precipitation is expected. Air quality: Moderate (PM2.5 ≈ 42 µg/m³). 👕 Light, comfortable clothing will be perfect."

---

## 💬 Example Queries

Try these example queries to see what the agent can do:

### Weather Queries
- "Weather in Kathmandu"
- "What's the temperature in New York today?"
- "Is it raining in London?"

### Clothing Recommendations
- "What should I wear in Kathmandu tomorrow morning?"
- "What to wear in Paris this weekend?"

### Air Quality
- "Is the air quality safe in London today?"
- "Air quality in Kathmandu"
- "PM2.5 levels in New York"

### Comparisons
- "Compare today vs tomorrow for a picnic in Kathmandu"
- "Which day is better for running: today or tomorrow?"

### Activity Planning
- "Is it safe to run at 6am Sunday in Kathmandu?"
- "Can I have a picnic tomorrow in London?"

### Follow-up Queries
- First: "Weather in Kathmandu"
- Then: "What about tomorrow?" (remembers Kathmandu!)

---

## 🧪 Testing

### Test the Agent Directly

You can run the agent directly from the command line:

```bash
# Make sure venv is activated
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Run agent directly
python -m weather_agent.agent
```

This will start an interactive CLI where you can type questions.

### Test with cURL

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed cURL examples.

**Quick Example:**
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "What is the weather in Kathmandu today?"
      }]
    }
  }'
```

---

## 🔧 Troubleshooting

### "Module not found" error
- Make sure you activated the virtual environment
- Install dependencies: `pip install google-adk python-dotenv`
- Verify installation: `python -c "import google.adk; print('OK')"`

### "Node.js not found" error
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal after installation

### "API key not found" error
- Check that `.env` file exists in the project root
- Make sure API keys are correct (no extra spaces)
- Ensure `.env` file is in the same directory as the project root

### "adk: command not found" error
- Install Google ADK: `pip install google-adk`
- Make sure virtual environment is activated
- Verify installation: `adk --version`

### Date showing incorrectly
- The agent automatically resolves dates using `get_current_datetime()`
- For ADK web, new sessions default to November 10, 2025 as reference date
- You can set a custom date by saying: "today is november 10, 2025, monday"

### MCP server not starting
- Ensure Node.js is installed and in PATH
- Check that `mcp-server/node_modules` exists (run `npm install` in `mcp-server/`)
- Verify MCP server can be started manually: `cd mcp-server && node index.js`

### ChatScope UI kit not working
- Make sure you've run `npm install` in the `frontend` folder
- Verify ChatScope packages are installed:
  ```bash
  cd frontend
  npm list @chatscope/chat-ui-kit-react @chatscope/chat-ui-kit-styles
  ```
- If packages are missing, install them manually:
  ```bash
  cd frontend
  npm install @chatscope/chat-ui-kit-react @chatscope/chat-ui-kit-styles
  ```

### Port 8000 already in use
- Stop any other services using port 8000
- Or change the port in ADK configuration

---

## 📊 API Data Sources

- **Weather Data**: [Open-Meteo API](https://open-meteo.com/) (free, no API key required)
- **Air Quality Data**: [OpenWeatherMap API](https://openweathermap.org/api) (requires API key)
- **AI Model**: Google Gemini 2.0 Flash (via Google Generative AI)

---

## 📚 Documentation

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with cURL examples
- **[API_DOCUMENTATION.md#examples--use-cases](API_DOCUMENTATION.md#examples--use-cases)** - More example queries

---

## 🆘 Need Help?

If you encounter issues:

1. Check that all prerequisites are installed
2. Verify your API keys are correct in `.env`
3. Make sure virtual environment is activated
4. Check the terminal for error messages
5. Review the logs for error entries
6. Ensure Google ADK is installed: `pip install google-adk`
7. For API testing, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## 🎓 Learning Resources

### Understanding the Code

1. **Start with `weather_agent/agent.py`** - This is the main agent
   - `root_agent` - ADK Agent instance (registered with ADK)
   - `MCPServer` - Wrapper for MCP client tools
   - `SYSTEM_PROMPT` - Instructions for the agent
   - `get_current_datetime()` - Function for date resolution

2. **Check `mcp-server/index.js`** - MCP server that calls external APIs
   - `get_weather()` - Fetches weather data from Open-Meteo
   - `get_air_quality()` - Fetches air quality data from OpenWeatherMap

3. **Look at `frontend/src/App.js`** - React frontend
   - How the UI sends requests to the API
   - Session management in the frontend

### Key Concepts

- **ADK (Agent Development Kit)**: Google's framework for building AI agents
- **MCP (Model Context Protocol)**: Protocol for tools that provide context to AI models
- **Session Management**: How the agent remembers previous messages
- **Intent Extraction**: How the agent understands what you're asking for

---

## 📝 License

This project is open source and available for educational purposes.

---

**Note**: This project uses Google ADK (Agent Development Kit) for deployment. The agent is defined as an `Agent` instance in `weather_agent/agent.py` with MCP tools for weather and air quality data. The agent automatically resolves relative dates ("today", "tomorrow", etc.) using the current system time.
