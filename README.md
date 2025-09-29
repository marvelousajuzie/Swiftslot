# SwiftSlot - Conflict-Free Booking App

A professional booking application where buyers can book vendors in 30-minute slots with mock payment processing. Built with conflict-free scheduling, idempotency, and UTC-safe operations.

## Features

- **Conflict-Free Booking**: Unique constraints prevent double-booking
- **Idempotent Operations**: Safe request replay with Idempotency-Key headers
- **UTC-Safe Timezone Handling**: All times stored in UTC, displayed in Africa/Lagos
- **2-Hour Buffer Validation**: Today's bookings must be at least 2 hours from now
- **Mock Payment System**: Realistic payment flow with status tracking
- **Real-time Updates**: Live availability refresh and booking status polling
- **Responsive Design**: Mobile-first UI with clean, modern styling

## Tech Stack

### Backend
- **Node.js 20+** with TypeScript
- **Express.js** for REST API
- **Sequelize** ORM with MySQL
- **Moment.js** for timezone handling
- **UUID** for unique reference generation

### Frontend
- **Vite** with React Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **SWR** for data fetching (planned)
- **Lucide React** for icons

### Testing
- **Jest + Supertest** for backend API testing
- **Vitest + React Testing Library** for frontend component testing

## Database Schema

\`\`\`sql
-- Core tables with UTC timestamps
vendors(id, name, timezone)
bookings(id, vendor_id, buyer_id, start_time_utc, end_time_utc, status, created_at)
booking_slots(id, booking_id, vendor_id, slot_start_utc) -- UNIQUE(vendor_id, slot_start_utc)
payments(id, booking_id, ref UNIQUE, status, raw_event_json)
idempotency_keys(key_value PRIMARY KEY, scope, response_hash, response_data)
\`\`\`

## API Endpoints

### Vendors
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id/availability?date=YYYY-MM-DD` - Get available slots

### Bookings
- `POST /api/bookings` - Create booking (requires Idempotency-Key header)
- `GET /api/bookings/:id` - Get booking details

### Payments
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/webhook` - Mock payment webhook
- `GET /api/payments/:ref` - Get payment status

## Getting Started

### Prerequisites
- Node.js 20+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone and install dependencies**
\`\`\`bash
npm install
cd server && npm install
cd ../client && npm install
\`\`\`

2. **Setup database**
\`\`\`bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE swiftslot;"

# Run database scripts
mysql -u root -p swiftslot < scripts/01-create-tables.sql
mysql -u root -p swiftslot < scripts/02-seed-data.sql
\`\`\`

3. **Configure environment**
\`\`\`bash
# Copy and edit server environment
cp server/.env.example server/.env
# Edit database credentials in server/.env
\`\`\`

4. **Start development servers**
\`\`\`bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server:dev  # Backend on :3001
npm run client:dev  # Frontend on :3000
\`\`\`

## Usage Flow

1. **Browse Vendors** - View available vendors on homepage
2. **Select Date** - Choose booking date (defaults to today)
3. **Pick Time Slot** - Select from available 30-minute slots (9:00-17:00 Lagos time)
4. **Review Booking** - Confirm vendor, date, time, and price
5. **Complete Payment** - Process mock payment ($50.00)
6. **Booking Confirmed** - Receive confirmation with booking ID

## Key Features Explained

### Conflict Prevention
- Each booking creates multiple `booking_slots` records (one per 30-min slot)
- Unique constraint on `(vendor_id, slot_start_utc)` prevents conflicts
- Competing requests: one succeeds (201), other gets 409 Conflict

### Idempotency
- All booking requests require `Idempotency-Key` header
- Duplicate requests with same key return identical response
- Prevents accidental double-booking from network retries

### Timezone Safety
- Database stores all timestamps in UTC
- UI displays times in Africa/Lagos timezone
- API accepts/returns ISO 8601 UTC timestamps
- 2-hour buffer validation uses Lagos local time

### Mock Payment Flow
1. Create booking (status: pending)
2. Initialize payment → get reference
3. Mock payment gateway → 90% success rate
4. Webhook simulation → mark payment success
5. Poll booking status → confirm paid status

## Error Handling

- **409 Conflict** - Slot no longer available
- **400 Bad Request** - Invalid data or 2-hour buffer violation
- **404 Not Found** - Vendor/booking not found
- **500 Server Error** - Database or system errors
- **Toast Notifications** - User-friendly error messages

## Development Notes

### Database Migrations
- Use SQL scripts in `/scripts` folder
- Version new scripts (e.g., `03-add-feature.sql`)
- Never edit existing executed scripts

### API Testing
\`\`\`bash
# Test vendor availability
curl "http://localhost:3001/api/vendors/1/availability?date=2024-01-15"

# Create booking with idempotency
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -d '{"vendorId":1,"startISO":"2024-01-15T14:00:00.000Z","endISO":"2024-01-15T14:30:00.000Z"}'
\`\`\`

### Frontend Development
- Components use TypeScript interfaces for type safety
- Toast notifications for user feedback
- Responsive design with Tailwind CSS
- Loading states and error boundaries


## License

MIT License - see LICENSE file for details.
# Swiftslot
# Swiftslot
