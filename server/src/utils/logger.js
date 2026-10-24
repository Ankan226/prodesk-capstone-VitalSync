const isProduction = process.env.NODE_ENV === 'production';

const info = (...args) => {
  if (!isProduction) process.stdout.write(`${args.join(' ')}\n`);
};

const error = (...args) => {
  console.error(...args);
};

module.exports = { info, error };