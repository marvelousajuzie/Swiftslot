#!/bin/bash

# SwiftSlot Development Startup Script

echo "🚀 Starting SwiftSlot Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL 8.0+ first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Check if database exists
DB_EXISTS=$(mysql -u root -p -e "SHOW DATABASES LIKE 'swiftslot';" 2>/dev/null | grep swiftslot)

if [ -z "$DB_EXISTS" ]; then
    echo "🗄️  Setting up database..."
    mysql -u root -p -e "CREATE DATABASE swiftslot;"
    mysql -u root -p swiftslot < scripts/01-create-tables.sql
    mysql -u root -p swiftslot < scripts/02-seed-data.sql
    echo "✅ Database setup complete!"
fi

# Copy environment files if they don't exist
if [ ! -f "server/.env" ]; then
    echo "⚙️  Creating server environment file..."
    cp server/.env.example server/.env
    echo "📝 Please edit server/.env with your database credentials"
fi

echo "🎯 Starting development servers..."
echo "   - Backend API: http://localhost:3001"
echo "   - Frontend UI: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Start both servers
npm run dev
