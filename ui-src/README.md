# RSS Feed Manager - React UI

This directory contains the React-based user interface for the RSS Feed Manager project.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Build for Production

```bash
# Build the app (outputs to ../docs folder for GitHub Pages)
npm run build

# Preview the production build
npm run preview
```

## 📁 Project Structure

```
ui-src/
├── src/
│   ├── App.jsx          # Main application component
│   ├── config.js        # GitHub API configuration
│   ├── index.css        # Tailwind CSS styles
│   └── main.jsx         # App entry point
├── public/              # Static assets
├── index.html           # HTML template
└── vite.config.js       # Vite build configuration
```

## 🎨 Features

### Articles Tab
- View recent articles from RSS feeds (last 24 hours)
- Expandable section for older articles (up to 1 week)
- Select multiple articles for publishing
- Visual indicators for published articles
- Click to select/deselect articles
- Article summaries and metadata

### Feeds Tab
- View all configured RSS feeds
- Add new feeds with name and URL
- Remove existing feeds
- Feed icons and descriptions

### Settings Tab
- Configure daily reminder time and timezone
- Customize Slack message templates
- Save preferences

## 🔧 Configuration

### GitHub Repository

Edit `src/config.js` to match your GitHub repository:

```javascript
export const CONFIG = {
  owner: 'your-username',
  repo: 'your-repo-name',
  branch: 'main',
};
```

## 🛠️ Tech Stack

- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## 📝 Build Output

The production build outputs to `../docs/` which is served by GitHub Pages.

## ⚠️ Important Notes

1. **Read-Only Preview**: Publishing, adding feeds, and saving settings show notifications but don't persist to GitHub.
2. **GitHub Workflow Integration**: To enable full functionality, create GitHub Actions workflows for write operations.
3. **Data Refresh**: Data is loaded from GitHub on page load. Refresh to see updates.
