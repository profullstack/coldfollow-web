# Convert2Doc Desktop App

This is the desktop application for Convert2Doc, which wraps the web application in an Electron shell.

## Development Setup

### Prerequisites

- Node.js (v14 or later)
- npm or pnpm

### Running the App

#### Using the provided scripts

The easiest way to run the app is to use one of the provided scripts:

```bash
# Using npm
./run.sh

# Using pnpm
./run-pnpm.sh
```

These scripts will automatically install dependencies if needed and start the app.

#### Manual setup

1. Install dependencies:
   ```bash
   # Using npm
   npm install
   
   # Using pnpm
   pnpm install
   ```

2. Start the app:
   ```bash
   # Using npm
   npm start
   
   # Using pnpm
   pnpm start
   ```

## Configuration

The app will connect to the Convert2Doc web application. The URL is determined in the following order:

1. From the `API_BASE_URL` environment variable
2. From the `API_BASE_URL` in the `.env` file in the project root
3. Fallback to the hardcoded URL: `https://convert2doc.com`

## Features

- Access Convert2Doc functionality in a desktop environment
- Native menu with reload, developer tools, and zoom options
- External links open in the default browser

## Keyboard Shortcuts

- Reload: `Ctrl+R` (Windows/Linux) or `Cmd+R` (macOS)
- Developer Tools: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Alt+I` (macOS)
- Zoom In: `Ctrl++` (Windows/Linux) or `Cmd++` (macOS)
- Zoom Out: `Ctrl+-` (Windows/Linux) or `Cmd+-` (macOS)
- Reset Zoom: `Ctrl+0` (Windows/Linux) or `Cmd+0` (macOS)
- Fullscreen: `F11` (Windows/Linux) or `Ctrl+Cmd+F` (macOS)

## Building

Building the app is currently experiencing issues. We recommend running the app in development mode using the provided scripts.

If you want to attempt building, you can try:

```bash
# Using npm
npm run build

# Using pnpm
pnpm build
```

Note that building may hang or fail due to missing icon files or other configuration issues.