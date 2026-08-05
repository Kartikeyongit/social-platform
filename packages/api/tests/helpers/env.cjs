module.exports = {
  API_URL: process.env.TEST_API_URL || 'http://localhost:4000/graphql',
  WS_URL: process.env.TEST_WS_URL || 'ws://localhost:4000/graphql',
};
