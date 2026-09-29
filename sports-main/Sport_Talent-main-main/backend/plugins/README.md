# 🔌 Sport Talent: Plugin System Guide for Developers

Welcome to the Sport Talent Plugin Architecture! 

To prevent merge conflicts and keep our core system stable, all new features should be built as **Plugins** inside this directory.

## How to Build a New Feature

When you are assigned a new feature (e.g., a "Leaderboard" or "Messaging" system), please follow these steps:

### 1. Create a Folder
Create a new folder inside `backend/plugins/` with the name of your feature. Let's pretend you are building a leaderboard:
`mkdir backend/plugins/leaderboard`

### 2. Write Your Logic
Inside your new folder, create your routes and controllers. You can import Prisma or any middleware you need.

```javascript
// backend/plugins/leaderboard/boardRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Your new API endpoint
router.get('/top-10', async (req, res) => {
    // Write your database logic here
    res.json({ message: "Leaderboard data goes here!" });
});

module.exports = router;
```

### 3. Fulfill the Plugin Contract (`index.js`)
To make sure the main server finds your new code, you **must** create an `index.js` file right next to your routes. This file tells the core server how to load your feature.

```javascript
// backend/plugins/leaderboard/index.js
const boardRoutes = require('./boardRoutes');

module.exports = {
    name: 'Global Leaderboard',               // Give your plugin a human-readable name
    baseRoute: '/api/v1/plugins/leaderboard', // The URL path you want to claim for your feature
    router: boardRoutes                       // Attach the router you built above
};
```

### 4. Database Changes
If your new feature requires a brand new database table, you **cannot** put the schema inside your plugin folder. 
You must open `backend/prisma/schema.prisma`, add your new table at the bottom, and run `npx prisma db push` to update the database.

### 5. Start the Server
You do not need to touch `server.js`! 

When you start the server (`node server.js`), the Plugin Engine will automatically detect your `leaderboard` folder and mount your routes. Look for this success message in the terminal:
> `🔌 [Plugin System]: Successfully loaded 'Global Leaderboard' at /api/v1/plugins/leaderboard`

---

*Note: If you are confused, look at the `example_feature` folder in this directory. You can copy/paste that folder to get started!*
