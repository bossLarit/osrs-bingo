# OSRS Bingo

A Battle Royale Bingo application for Old School RuneScape, featuring team management, bingo boards, and integration with the Wise Old Man API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

## Features

- **Team Management**: Create teams with custom colors and add OSRS player accounts
- **Bingo Board**: Visual bingo grid showing which team leads each tile
- **Scoreboard**: Real-time ranking of teams based on completed tiles
- **Hover Details**: See detailed progress for each tile when hovering
- **WOM Integration**: Sync player data from Wise Old Man API

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + SQLite

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend:

```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

## Usage

1. **Create Teams**: Go to "Hold" tab and create teams with names and colors
2. **Add Players**: Select a team and add OSRS usernames
3. **Setup Bingo Tiles**: Go to "Felter" tab to create bingo tiles or generate examples
4. **Track Progress**: Update progress manually or use "Sync WOM" to fetch data
5. **View Board**: The main bingo board shows which team leads each tile

## API Endpoints

### Teams

- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team with players
- `DELETE /api/teams/:id` - Delete team

### Players

- `POST /api/teams/:teamId/players` - Add player to team
- `DELETE /api/players/:id` - Remove player

### Tiles

- `GET /api/tiles` - List all tiles
- `POST /api/tiles` - Create tile
- `POST /api/tiles/bulk` - Bulk create tiles
- `PUT /api/tiles/:id` - Update tile
- `DELETE /api/tiles/:id` - Delete tile

### Progress

- `GET /api/progress` - Get all progress
- `POST /api/progress` - Update progress for tile/team

### WOM Integration

- `GET /api/wom/player/:username` - Get player data from WOM
- `POST /api/sync` - Sync all players with WOM

## Environment Variables

### Backend (`backend/.env`)

```env
ADMIN_PASSWORD=your_secure_password
PORT=3001
NODE_ENV=production
```

### Frontend (GitHub Secrets for deployment)

```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Deployment

### Frontend (GitHub Pages)

The frontend is automatically deployed via GitHub Actions when pushing to main.

### Backend (Render)

1. Connect your GitHub repo to Render
2. Set environment variables in Render dashboard
3. Deploy from main branch

## Project Structure

```
osrs-bingo/
├── backend/
│   ├── server.js          # Express API server
│   ├── data.json           # JSON database (auto-generated)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── App.jsx         # Main app component
│   └── package.json
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions workflow
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
