#!/bin/bash

echo "⏳ Waiting for you to add Redis to Railway..."
echo ""
echo "Please add Redis to your Railway project:"
echo "1. Go to https://railway.app/project/26613e59-06b5-409b-ad5c-08da9ee7777d"
echo "2. Click '+ New' → 'Database' → 'Add Redis'"
echo "3. Wait for Redis to deploy (usually takes 1-2 minutes)"
echo ""
echo "Press Enter when Redis has been added..."
read

echo ""
echo "🔍 Checking for Redis..."

# Test if Redis is configured
cd /Users/alekenov/projects/shadcn-test
/Users/alekenov/.npm-global/bin/railway run python3 backend/scripts/verify_redis.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Redis is configured and working!"
    echo ""
    echo "Now deploying the application with Redis support..."
    railway up -c
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Testing authentication with Redis..."
    
    # Request OTP
    echo "1. Requesting OTP..."
    OTP=$(curl -X POST https://cvety-kz-production.up.railway.app/api/auth/request-otp \
      -H "Content-Type: application/json" \
      -d '{"phone": "+77771234567"}' \
      -s | jq -r '.otp')
    
    if [ -z "$OTP" ]; then
        echo "❌ Failed to get OTP"
    else
        echo "✅ Got OTP: $OTP"
        
        # Verify OTP
        echo "2. Verifying OTP..."
        RESPONSE=$(curl -X POST https://cvety-kz-production.up.railway.app/api/auth/verify-otp \
          -H "Content-Type: application/json" \
          -d "{\"phone\": \"+77771234567\", \"otp_code\": \"$OTP\"}" \
          -s)
        
        if echo "$RESPONSE" | grep -q "access_token"; then
            echo "✅ Authentication successful!"
            echo "$RESPONSE" | jq '.'
        else
            echo "❌ Authentication failed:"
            echo "$RESPONSE"
        fi
    fi
else
    echo ""
    echo "❌ Redis is not configured yet"
    echo "Please add Redis to your Railway project and run this script again"
fi