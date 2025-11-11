# Weather & Air Quality Chat UI

React-based chat interface for the Weather & Air Quality Planner agent.

## Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## Features

- Clean chat interface using ChatScope UI Kit
- Session management (maintains session ID in sessionStorage)
- Markdown rendering (bold, italic, code, line breaks)
- Loading indicators
- Responsive design

## Requirements

- Node.js 18+
- ADK server running on `http://localhost:8000`

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

