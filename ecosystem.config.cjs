module.exports = {
  apps: [
    {
      name: 'app',
      script: 'dist/index.js', // This is where your compiled TypeScript file will run from
      instances: 'max', // Use all CPU cores available for max performance
      exec_mode: 'cluster', // Cluster mode to run the app across multiple CPU cores
      autorestart: true,
      watch: false, // You don't need to watch in production
      max_memory_restart: '1.5G', // Restart the app if it exceeds 1.5GB memory usage
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
  deploy: {
    /* production: {
      user: 'your-username',
      host: 'your-server-ip',
      ref: 'origin/main', // Git branch to deploy
      repo: 'git@github.com:your-repo.git', // Your GitHub repo URL
      path: '/var/www/api', // Path to the app on the server
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production', // Post-deploy hook
    }, */
  },
};
