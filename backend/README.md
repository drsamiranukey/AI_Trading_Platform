# AI Trading Platform - Backend

A comprehensive FastAPI-based backend for an AI-powered trading platform with MetaTrader 5 integration, subscription management, and advanced trading features.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **MetaTrader 5 Integration** - Real-time trading and account management
- **AI-Powered Trading Signals** - Machine learning-based market analysis
- **Subscription Management** - Stripe integration for payment processing
- **Real-time Dashboard** - Trading metrics and performance analytics
- **Risk Management** - Configurable risk parameters and position sizing
- **Admin Panel** - User management and system monitoring
- **RESTful API** - Comprehensive API with OpenAPI documentation

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL 12+
- Redis 6+
- MetaTrader 5 Terminal
- Stripe Account (for payments)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI_Trading_Platform/backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Database Setup

```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Run migrations
alembic upgrade head

# Initialize database with admin user
python scripts/init_db.py
```

## 🐳 Docker Development

### Quick Start with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Services Included

- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:5050

## 🚀 Running the Application

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🗄️ Database Management

### Create Migration

```bash
python scripts/create_migration.py create "migration message"
```

### Apply Migrations

```bash
python scripts/create_migration.py upgrade
```

### Reset Database

```bash
python scripts/init_db.py --reset
```

## 🧪 Testing

### Run Structure Tests

```bash
python test_imports.py
```

### Run Unit Tests (when implemented)

```bash
pytest tests/
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/     # API route handlers
│   │       └── api.py         # Main API router
│   ├── core/
│   │   ├── config.py          # Configuration settings
│   │   ├── database.py        # Database connection
│   │   ├── security.py        # Authentication utilities
│   │   └── init_db.py         # Database initialization
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic services
│   └── main.py                # FastAPI application
├── alembic/                   # Database migrations
├── scripts/                   # Utility scripts
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker configuration
└── docker-compose.dev.yml     # Development environment
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key
- `STRIPE_SECRET_KEY`: Stripe API key
- `MT5_SERVER`: MetaTrader 5 server
- `REDIS_URL`: Redis connection string

### Trading Configuration

- `DEFAULT_RISK_PER_TRADE`: Default risk percentage per trade (2.0%)
- `DEFAULT_MAX_DAILY_LOSS`: Maximum daily loss limit (10.0%)
- `DEFAULT_MAX_OPEN_POSITIONS`: Maximum concurrent positions (5)

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy

## 📊 Monitoring

- Structured logging with structlog
- Health check endpoints
- Prometheus metrics (when configured)
- Error tracking with Sentry (optional)

## 🚀 Deployment

### Production Checklist

1. Set `ENVIRONMENT=production` in `.env`
2. Use strong `SECRET_KEY`
3. Configure proper database credentials
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging
7. Configure backup strategy

### Docker Production

```bash
docker build -t ai-trading-backend .
docker run -d -p 8000:8000 --env-file .env ai-trading-backend
```

## 🤝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token

### Trading
- `GET /api/v1/trading/positions` - Get open positions
- `POST /api/v1/trading/execute` - Execute trade
- `GET /api/v1/trading/history` - Trading history

### Subscriptions
- `GET /api/v1/subscription/plans` - Available plans
- `POST /api/v1/subscription/create-payment-intent` - Create payment
- `POST /api/v1/subscription/confirm-payment` - Confirm payment

### Dashboard
- `GET /api/v1/dashboard/overview` - Dashboard overview
- `GET /api/v1/dashboard/performance` - Performance metrics

### Admin
- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/users` - User management

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env

2. **MetaTrader 5 Connection Failed**
   - Ensure MT5 terminal is running
   - Check MT5 credentials in .env

3. **Import Errors**
   - Run `python test_imports.py` to check structure
   - Ensure all dependencies are installed

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.