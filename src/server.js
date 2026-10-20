import { createApp } from './app.js';
const port = process.env.PORT || 3000;
const app = createApp(process.env.DB_FILE || './data.db');
app.listen(port, () => console.log(`Ajaia Docs running on http://localhost:${port}`));
