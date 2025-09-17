# AI Trading Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the AI Trading Platform in various environments.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │     Redis       │    │   MetaTrader5   │
│  (Reverse Proxy)│    │   (Caching)     │    │   (Trading)     │
│   Port: 80/443  │    │   Port: 6379    │    │   External      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Deployment Options

### 1. Local Development

#### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
alembic upgrade head
python scripts/init_db.py
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 2. Docker Development

#### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd AI_Trading_Platform

# Start all services
docker-compose -f backend/docker-compose.dev.yml up -d

# Check status
docker-compose -f backend/docker-compose.dev.yml ps
```

#### Services
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000 (if configured)
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- pgAdmin: http://localhost:5050

### 3. Production Deployment

#### Option A: Docker Production

1. **Prepare Environment**
```bash
# Create production environment file
cp backend/.env.example backend/.env.prod
# Edit .env.prod with production values
```

2. **Build Images**
```bash
# Build backend
cd backend
docker build -t ai-trading-backend:latest .

# Build frontend
cd ../frontend
docker build -t ai-trading-frontend:latest .
```

3. **Deploy with Docker Compose**
```bash
# Create production docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_trading_platform
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ai_trading_network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - ai_trading_network

  backend:
    image: ai-trading-backend:latest
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/ai_trading_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - ai_trading_network

  frontend:
    image: ai-trading-frontend:latest
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - ai_trading_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - ai_trading_network

volumes:
  postgres_data:
  redis_data:

networks:
  ai_trading_network:
    driver: bridge
```

#### Option B: Cloud Deployment (AWS/GCP/Azure)

1. **Container Registry**
```bash
# Tag images for registry
docker tag ai-trading-backend:latest your-registry/ai-trading-backend:latest
docker tag ai-trading-frontend:latest your-registry/ai-trading-frontend:latest

# Push to registry
docker push your-registry/ai-trading-backend:latest
docker push your-registry/ai-trading-frontend:latest
```

2. **Database Setup**
- Use managed PostgreSQL service (AWS RDS, GCP Cloud SQL, Azure Database)
- Use managed Redis service (AWS ElastiCache, GCP Memorystore, Azure Cache)

3. **Container Orchestration**
- **Kubernetes**: Use provided k8s manifests
- **AWS ECS**: Create task definitions
- **Google Cloud Run**: Deploy containers
- **Azure Container Instances**: Deploy containers

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_trading_platform
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# MetaTrader 5
MT5_SERVER=your-mt5-server
MT5_LOGIN=your-mt5-login
MT5_PASSWORD=your-mt5-password

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://yourdomain.com
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
NEXT_PUBLIC_ENVIRONMENT=production
```

### Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

## 🔒 Security Checklist

### Pre-Deployment
- [ ] Change default passwords
- [ ] Use strong SECRET_KEY
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable CORS properly
- [ ] Configure rate limiting
- [ ] Set up monitoring

### Database Security
- [ ] Use strong database passwords
- [ ] Enable SSL connections
- [ ] Restrict database access
- [ ] Regular backups
- [ ] Monitor database logs

### Application Security
- [ ] Input validation
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure headers
- [ ] API rate limiting

## 📊 Monitoring & Logging

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
curl http://localhost:8000/health/db

# Redis connection
curl http://localhost:8000/health/redis
```

### Logging
- Application logs: `/var/log/ai-trading/`
- Database logs: PostgreSQL logs
- Web server logs: Nginx access/error logs
- Container logs: `docker logs <container_name>`

### Monitoring Tools
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Sentry**: Error tracking
- **New Relic**: Application monitoring
- **DataDog**: Infrastructure monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy AI Trading Platform

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Test Backend
        run: |
          cd backend
          python -m pytest tests/
      - name: Test Frontend
        run: |
          cd frontend
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and Deploy
        run: |
          docker build -t ai-trading-backend backend/
          docker build -t ai-trading-frontend frontend/
          # Deploy to your infrastructure
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   systemctl status postgresql
   
   # Check connection
   psql -h localhost -U user -d ai_trading_platform
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **MetaTrader 5 Connection Issues**
   - Ensure MT5 terminal is running
   - Check firewall settings
   - Verify credentials
   - Check server connectivity

4. **SSL Certificate Issues**
   ```bash
   # Check certificate validity
   openssl x509 -in cert.pem -text -noout
   
   # Test SSL connection
   openssl s_client -connect yourdomain.com:443
   ```

### Performance Optimization

1. **Database Optimization**
   - Add database indexes
   - Optimize queries
   - Use connection pooling
   - Regular VACUUM and ANALYZE

2. **Application Optimization**
   - Enable caching
   - Optimize API responses
   - Use async operations
   - Implement pagination

3. **Infrastructure Optimization**
   - Use CDN for static assets
   - Enable gzip compression
   - Optimize Docker images
   - Use load balancing

## 📋 Maintenance

### Regular Tasks
- [ ] Update dependencies
- [ ] Monitor disk space
- [ ] Check log files
- [ ] Backup database
- [ ] Update SSL certificates
- [ ] Security patches
- [ ] Performance monitoring

### Backup Strategy
```bash
# Database backup
pg_dump -h localhost -U user ai_trading_platform > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/application

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -h localhost -U user ai_trading_platform > $BACKUP_DIR/db_$DATE.sql

# Compress and upload to cloud storage
gzip $BACKUP_DIR/db_$DATE.sql
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://your-backup-bucket/
```

## 📞 Support

For deployment support:
1. Check logs for error messages
2. Review configuration files
3. Test individual components
4. Contact development team
5. Create support ticket

---

**Note**: This deployment guide assumes familiarity with Docker, web servers, and database administration. For production deployments, consider consulting with a DevOps engineer or system administrator.