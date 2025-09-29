#!/bin/bash

# SwiftSlot API Testing Script

API_BASE="http://localhost:3001/api"
TODAY=$(date +%Y-%m-%d)

echo "🧪 Testing SwiftSlot API..."
echo "Base URL: $API_BASE"
echo "Test Date: $TODAY"
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
curl -s "$API_BASE/../health" | jq '.'
echo ""

# Test 2: Get vendors
echo "2️⃣  Testing vendors list..."
curl -s "$API_BASE/vendors" | jq '.'
echo ""

# Test 3: Get availability
echo "3️⃣  Testing availability for vendor 1..."
curl -s "$API_BASE/vendors/1/availability?date=$TODAY" | jq '.'
echo ""

# Test 4: Create booking (will likely fail due to 2-hour buffer)
echo "4️⃣  Testing booking creation..."
IDEMPOTENCY_KEY="test-$(date +%s)"
FUTURE_TIME=$(date -d "+3 hours" -u +%Y-%m-%dT%H:00:00.000Z)
FUTURE_END=$(date -d "+3.5 hours" -u +%Y-%m-%dT%H:30:00.000Z)

curl -s -X POST "$API_BASE/bookings" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "{
    \"vendorId\": 1,
    \"startISO\": \"$FUTURE_TIME\",
    \"endISO\": \"$FUTURE_END\"
  }" | jq '.'
echo ""

echo "✅ API tests complete!"
