# Rootly – Production Errors

View production errors from your deployed applications directly in VS Code.

## Features

- **Real-time incident monitoring** - See production errors as they happen
- **GitHub OAuth authentication** - Secure login with your GitHub account
- **Automatic repository detection** - Detects your current repo from `.git/config`
- **Clean, minimal UI** - Professional dark-themed sidebar

## Requirements

- A GitHub account
- A project registered on Rootly (https://rootly.app)
- VS Code 1.85.0 or higher

## Usage

1. **Login**: Run command `Rootly: Login` from the command palette
2. **View incidents**: Click the Rootly icon in the activity bar
3. **Click an incident** to view full details including stack trace

## Development

### Install dependencies
```bash
npm install
```

### Compile
```bash
npm run compile
```

### Run in development
1. Open this folder in VS Code
2. Press F5 to launch Extension Development Host
3. Test the extension in the new window

### Package
```bash
npm run package
```

## Configuration

The extension connects to `http://localhost:3001` by default for local development.

## Privacy

- Authentication tokens are stored securely using VS Code's SecretStorage
- No data is sent to third parties
- Only reads `.git/config` to detect repository

## License

MIT
