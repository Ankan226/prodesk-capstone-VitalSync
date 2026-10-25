const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');


process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

connectDB().then(() => {
  app.listen(port, () => logger.info(`API listening on port ${port}`));
});