const timestamp = () => new Date().toISOString().slice(11, 19);

module.exports = {
  info:  (...args) => console.log(`[${timestamp()}] ℹ`, ...args),
  warn:  (...args) => console.warn(`[${timestamp()}] ⚠`, ...args),
  error: (...args) => console.error(`[${timestamp()}] ✖`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${timestamp()}] 🔍`, ...args);
    }
  },
};
