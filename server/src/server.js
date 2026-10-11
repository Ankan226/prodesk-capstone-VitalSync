const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

connectDB().then(() => {
  app.listen(port, () => console.log(`API listening on port ${port}`));
});