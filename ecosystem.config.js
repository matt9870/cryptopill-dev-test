module.exports = {
  apps: [{
    script: 'dist/server.js',
    name: 'cryptopill-dev',
    env: {
      NODE_ENV: 'dev'
    }
  },
  {
    script: 'dist/server.js',
    name: 'cryptopill',
    env_dev: {
      NODE_ENV: null
    }
  }
  ]
};
