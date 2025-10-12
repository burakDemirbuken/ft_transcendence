#!/bin/bash
# filepath: /sgoinfre/ulyildiz/ft_transcendence/backend/profile/test.sh

BASE_URL="http://localhost:3006"

echo "=== Testing Profile Service ==="
echo ""

# Test 1: Create test match data
echo "1. Creating match data..."
curl -X POST "${BASE_URL}/internal/match" \
  -H "Content-Type: application/json" \
  -d '{
    "team1": {
      "playersId": ["user1", "user2"],
      "score": 5
    },
    "team2": {
      "playersId": ["user3", "user4"],
      "score": 3
    },
    "winner": 1,
    "matchType": "2v2",
    "state": {
      "players": [
        { "id": "user1", "kickBall": 15, "missedBall": 3 },
        { "id": "user2", "kickBall": 12, "missedBall": 5 },
        { "id": "user3", "kickBall": 8, "missedBall": 7 },
        { "id": "user4", "kickBall": 10, "missedBall": 4 }
      ]
    },
    "time": {
      "duration": 120000
    }
  }'
echo -e "\n"

# Test 2: Get user profile
echo "2. Getting user profile..."
curl -X GET "${BASE_URL}/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "user1"
  }'
echo -e "\n"

# Test 3: Update user profile
echo "3. Updating user profile..."
curl -X PUT "${BASE_URL}/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "UserName": "user1",
    "displayName": "Player One",
    "bio": "I love playing pong!",
    "avatarUrl": "https://example.com/avatar1.png"
  }'
echo -e "\n"

# Test 4: Get updated profile
echo "4. Getting updated profile..."
curl -X GET "${BASE_URL}/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "user1"
  }'
echo -e "\n"

echo "=== Tests Complete ==="