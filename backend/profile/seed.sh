#!/bin/bash
# filepath: /sgoinfre/ulyildiz/ft_transcendence/backend/profile/seed.sh

BASE_URL="http://localhost:3006"

echo "=== Seeding Database ==="
echo ""

# You'll need to create profiles first through your auth service
# This script assumes profiles exist

# Create multiple matches to test achievements
echo "Creating match 1 (user1 & user2 win)..."
curl -X POST "${BASE_URL}/internal/match" \
  -H "Content-Type: application/json" \
  -d '{
    "team1": {"playersId": ["user1", "user2"], "score": 5},
    "team2": {"playersId": ["user3", "user4"], "score": 2},
    "winner": 1,
    "matchType": "2v2",
    "state": {
      "players": [
        {"id": "user1", "kickBall": 20, "missedBall": 2},
        {"id": "user2", "kickBall": 18, "missedBall": 3},
        {"id": "user3", "kickBall": 10, "missedBall": 8},
        {"id": "user4", "kickBall": 12, "missedBall": 6}
      ]
    },
    "time": {"duration": 150000}
  }'
echo -e "\n"

echo "Creating match 2 (user1 wins solo)..."
curl -X POST "${BASE_URL}/internal/match" \
  -H "Content-Type: application/json" \
  -d '{
    "team1": {"playersId": ["user1"], "score": 5},
    "team2": {"playersId": ["user3"], "score": 4},
    "winner": 1,
    "matchType": "1v1",
    "state": {
      "players": [
        {"id": "user1", "kickBall": 25, "missedBall": 4},
        {"id": "user3", "kickBall": 22, "missedBall": 5}
      ]
    },
    "time": {"duration": 170000}
  }'
echo -e "\n"

echo "Creating match 3 (quick match - less than 3 min)..."
curl -X POST "${BASE_URL}/internal/match" \
  -H "Content-Type: application/json" \
  -d '{
    "team1": {"playersId": ["user1"], "score": 5},
    "team2": {"playersId": ["user4"], "score": 0},
    "winner": 1,
    "matchType": "1v1",
    "state": {
      "players": [
        {"id": "user1", "kickBall": 30, "missedBall": 1},
        {"id": "user4", "kickBall": 5, "missedBall": 15}
      ]
    },
    "time": {"duration": 120000}
  }'
echo -e "\n"

echo "=== Seeding Complete ==="