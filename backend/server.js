// Env vars are loaded by Node itself (`--env-file=.env` in the dev script),
// so no dotenv import is needed.
import app from './app.js';

// import database call

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server successfully running on: http://localhost:${PORT}`);
});
