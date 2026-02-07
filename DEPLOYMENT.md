# Deployment Guide

This guide covers deploying the Bangladeshi Monopoly multiplayer game to various platforms.

## Prerequisites

- Git installed
- Node.js 18+ installed
- A GitHub account (for cloud deployments)

## Local Development

### Running Locally

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Access the game
# Open http://localhost:3000 in your browser
```

### Environment Variables (Optional)

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

## Local Network (LAN) Deployment

Perfect for playing with friends on the same WiFi network.

### Setup Steps

1. **Find your local IP address**:
   
   **Windows**:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   **Mac/Linux**:
   ```bash
   ifconfig
   # or
   ip addr show
   ```
   Look for your local IP (192.168.x.x or 10.0.x.x)

2. **Start the server**:
   ```bash
   cd server
   npm start
   ```

3. **Share the URL**:
   - Your URL: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`
   - Share this with players on your network

4. **Firewall Configuration**:
   - Allow port 3000 through your firewall
   - **Windows**: Windows Defender Firewall → Allow an app
   - **Mac**: System Preferences → Security → Firewall → Firewall Options
   - **Linux**: `sudo ufw allow 3000`

### QR Code for Easy Mobile Access

Generate a QR code for your game URL using a service like [qr-code-generator.com](https://www.qr-code-generator.com/):
1. Enter your URL (e.g., `http://192.168.1.100:3000`)
2. Generate QR code
3. Players scan to join instantly

## Cloud Deployment

### Option 1: Railway (Recommended)

Railway offers free tier and easy deployment.

#### Steps:

1. **Push code to GitHub**:
   ```bash
   git push origin main
   ```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `monopoly-web` repository
   - Railway auto-detects Node.js

3. **Configure**:
   - Set root directory to `server` if needed
   - Add environment variables in Railway dashboard
   - Set start command: `npm start`

4. **Domain**:
   - Railway provides a free domain
   - Or add custom domain in settings

#### Railway Configuration

Create `railway.json` in project root:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Option 2: Heroku

#### Steps:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create app**:
   ```bash
   heroku create monopoly-game-bd
   ```

4. **Configure buildpack**:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

5. **Add Procfile** in server directory:
   ```
   web: node server.js
   ```

6. **Deploy**:
   ```bash
   git push heroku main
   ```

7. **Open**:
   ```bash
   heroku open
   ```

#### Heroku Configuration

Add environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
```

### Option 3: DigitalOcean App Platform

1. **Create account** at [digitalocean.com](https://digitalocean.com)
2. **Create new app** → GitHub → Select repository
3. **Configure**:
   - Detect resource: Node.js
   - Build command: `cd server && npm install`
   - Run command: `cd server && npm start`
   - Port: 3000
4. **Deploy** → App URL provided

### Option 4: Render

1. **Sign up** at [render.com](https://render.com)
2. **New Web Service** → Connect GitHub repository
3. **Configure**:
   - Name: monopoly-game
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Instance Type: Free
4. **Create Web Service**

### Option 5: VPS (Advanced)

For full control, deploy to a VPS like DigitalOcean Droplet, AWS EC2, or Linode.

#### Ubuntu VPS Setup:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Git
sudo apt install -y git

# 4. Clone repository
git clone https://github.com/WakifRajin/monopoly-web.git
cd monopoly-web/server

# 5. Install dependencies
npm install

# 6. Install PM2 (process manager)
sudo npm install -g pm2

# 7. Start application
pm2 start server.js --name monopoly

# 8. Save PM2 configuration
pm2 save
pm2 startup

# 9. Configure Nginx (reverse proxy)
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/monopoly
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/monopoly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL Certificate (HTTPS):

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Production Considerations

### Environment Variables

Set these in your production environment:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
```

### Performance

1. **Enable compression**:
   ```bash
   npm install compression
   ```
   
   Add to server.js:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Use CDN** for static files (optional)

3. **Database** for persistence (optional):
   - Add SQLite or PostgreSQL
   - Store game history
   - Player statistics

### Monitoring

1. **PM2 Monitoring**:
   ```bash
   pm2 monit
   ```

2. **Logging**:
   - Logs stored in `/root/.pm2/logs/`
   - View with: `pm2 logs monopoly`

3. **Health Checks**:
   - Endpoint: `GET /api/health`
   - Set up monitoring with UptimeRobot or similar

### Scaling

For high traffic:

1. **Horizontal Scaling**:
   - Use Redis for session storage
   - Load balancer across multiple instances
   - Sticky sessions for Socket.IO

2. **Vertical Scaling**:
   - Increase server resources
   - Optimize Node.js memory settings

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Find process
   lsof -ti:3000
   # Kill it
   kill -9 <PID>
   ```

2. **WebSocket Connection Failed**:
   - Check firewall settings
   - Ensure proxy supports WebSocket
   - Verify CORS configuration

3. **Module Not Found**:
   ```bash
   cd server
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Permission Denied** (Linux/Mac):
   ```bash
   sudo chown -R $USER:$USER .
   ```

## Testing Deployment

After deployment:

1. **Health Check**:
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Load Test**:
   - Use tools like Apache Bench or Artillery
   - Test concurrent connections

3. **Browser Test**:
   - Test on different devices
   - Check mobile responsiveness
   - Verify WebSocket connection

## Backup

### Manual Backup

```bash
# Backup entire project
tar -czf monopoly-backup-$(date +%Y%m%d).tar.gz monopoly-web/
```

### Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * tar -czf /backups/monopoly-$(date +\%Y\%m\%d).tar.gz /path/to/monopoly-web/
```

## Updating

### Pull Latest Changes

```bash
# Navigate to project
cd monopoly-web

# Pull changes
git pull origin main

# Update dependencies
cd server
npm install

# Restart server
pm2 restart monopoly
```

## Support

For deployment issues:
- Check server logs: `pm2 logs`
- Review error messages
- Consult platform documentation
- Open GitHub issue for bugs

---

## Quick Reference

### Local Development
```bash
cd server && npm run dev
```

### Production Start
```bash
cd server && npm start
```

### With PM2
```bash
pm2 start server/server.js --name monopoly
```

### View Logs
```bash
pm2 logs monopoly
```

### Stop Server
```bash
pm2 stop monopoly
```

---

**Note**: Choose the deployment method that best fits your technical skills and requirements. For quick testing, use Railway or Render. For production with high traffic, use VPS with proper scaling configuration.
