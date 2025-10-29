#!/bin/bash

# Friendship Testing Script
# This script creates various friendship combinations for test users (test0-test9)
# to populate the database with test data

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
# Use friend service directly (runs on port 3007 inside Docker network)
FRIEND_SERVICE_URL="http://friend:3007"

# Test users array
USERS=("test0" "test1" "test2" "test3" "test4" "test5" "test6" "test7" "test8" "test9")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Friendship Test Data Generator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Counter for statistics
TOTAL_REQUESTS=0
SUCCESSFUL_SENDS=0
SUCCESSFUL_ACCEPTS=0
FAILED_REQUESTS=0

# Function to send friend request
send_friend_request() {
    local from=$1
    local to=$2

    echo -e "${YELLOW}[SEND]${NC} $from -> $to"

    response=$(curl -s -w "\n%{http_code}" -X POST "${FRIEND_SERVICE_URL}/send" \
        -H "Content-Type: application/json" \
        -d "{\"userName\":\"$from\",\"peerName\":\"$to\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    ((TOTAL_REQUESTS++))

    if [ "$http_code" = "201" ]; then
        echo -e "${GREEN}  ✓ Success${NC}"
        ((SUCCESSFUL_SENDS++))
        return 0
    else
        echo -e "${RED}  ✗ Failed (HTTP $http_code): $body${NC}"
        ((FAILED_REQUESTS++))
        return 1
    fi
}

# Function to accept friend request
accept_friend_request() {
    local accepter=$1
    local requester=$2

    echo -e "${YELLOW}[ACCEPT]${NC} $accepter accepts $requester"

    response=$(curl -s -w "\n%{http_code}" -X POST "${FRIEND_SERVICE_URL}/accept" \
        -H "Content-Type: application/json" \
        -d "{\"userName\":\"$accepter\",\"peerName\":\"$requester\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    ((TOTAL_REQUESTS++))

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}  ✓ Accepted${NC}"
        ((SUCCESSFUL_ACCEPTS++))
        return 0
    else
        echo -e "${RED}  ✗ Failed (HTTP $http_code): $body${NC}"
        ((FAILED_REQUESTS++))
        return 1
    fi
}

# Add a small delay between requests to avoid overwhelming the server
add_delay() {
    sleep 0.1
}

echo -e "${BLUE}Creating friendship combinations...${NC}"
echo ""

# ===================================
# Scenario 1: Mutual accepted friends
# ===================================
echo -e "${BLUE}--- Scenario 1: Mutual Accepted Friends ---${NC}"

# test0 and test1 are friends
send_friend_request "test0" "test1"
add_delay
accept_friend_request "test1" "test0"
add_delay

# test0 and test2 are friends
send_friend_request "test0" "test2"
add_delay
accept_friend_request "test2" "test0"
add_delay

# test1 and test2 are friends
send_friend_request "test1" "test2"
add_delay
accept_friend_request "test2" "test1"
add_delay

# test3 and test4 are friends
send_friend_request "test3" "test4"
add_delay
accept_friend_request "test4" "test3"
add_delay

# test3 and test5 are friends
send_friend_request "test3" "test5"
add_delay
accept_friend_request "test5" "test3"
add_delay

# test4 and test5 are friends
send_friend_request "test4" "test5"
add_delay
accept_friend_request "test5" "test4"
add_delay

echo ""

# ===================================
# Scenario 2: Pending friend requests (not accepted)
# ===================================
echo -e "${BLUE}--- Scenario 2: Pending Friend Requests ---${NC}"

# test6 sends request to test7 (pending)
send_friend_request "test6" "test7"
add_delay

# test6 sends request to test8 (pending)
send_friend_request "test6" "test8"
add_delay

# test7 sends request to test9 (pending)
send_friend_request "test7" "test9"
add_delay

# test8 sends request to test0 (pending)
send_friend_request "test8" "test0"
add_delay

echo ""

# ===================================
# Scenario 3: Mixed connections
# ===================================
echo -e "${BLUE}--- Scenario 3: Mixed Connections ---${NC}"

# test2 and test3 are friends
send_friend_request "test2" "test3"
add_delay
accept_friend_request "test3" "test2"
add_delay

# test5 and test6 are friends
send_friend_request "test5" "test6"
add_delay
accept_friend_request "test6" "test5"
add_delay

# test9 sends request to test0 (pending)
send_friend_request "test9" "test0"
add_delay

# test1 and test5 are friends
send_friend_request "test1" "test5"
add_delay
accept_friend_request "test5" "test1"
add_delay

echo ""

# ===================================
# Scenario 4: More complex network
# ===================================
echo -e "${BLUE}--- Scenario 4: Complex Network ---${NC}"

# test4 and test7 are friends
send_friend_request "test4" "test7"
add_delay
accept_friend_request "test7" "test4"
add_delay

# test2 and test6 are friends
send_friend_request "test2" "test6"
add_delay
accept_friend_request "test6" "test2"
add_delay

# test8 and test9 are friends
send_friend_request "test8" "test9"
add_delay
accept_friend_request "test9" "test8"
add_delay

# test0 and test7 are friends
send_friend_request "test0" "test7"
add_delay
accept_friend_request "test7" "test0"
add_delay

# test3 sends request to test9 (pending)
send_friend_request "test3" "test9"
add_delay

# test1 and test8 are friends
send_friend_request "test1" "test8"
add_delay
accept_friend_request "test8" "test1"
add_delay

echo ""

# ===================================
# Scenario 5: More pending requests
# ===================================
echo -e "${BLUE}--- Scenario 5: Additional Pending Requests ---${NC}"

# test4 sends request to test9 (pending)
send_friend_request "test4" "test9"
add_delay

# test7 sends request to test2 (pending)
send_friend_request "test7" "test2"
add_delay

# test5 sends request to test8 (pending)
send_friend_request "test5" "test8"
add_delay

echo ""

# ===================================
# Statistics Summary
# ===================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Requests:       ${TOTAL_REQUESTS}"
echo -e "${GREEN}Friend Requests Sent: ${SUCCESSFUL_SENDS}${NC}"
echo -e "${GREEN}Friend Requests Accepted: ${SUCCESSFUL_ACCEPTS}${NC}"
echo -e "${RED}Failed Requests:      ${FAILED_REQUESTS}${NC}"
echo ""

# Calculate pending requests
PENDING_REQUESTS=$((SUCCESSFUL_SENDS - SUCCESSFUL_ACCEPTS))
echo -e "${YELLOW}Pending Requests:     ${PENDING_REQUESTS}${NC}"
echo ""

# ===================================
# Friendship Network Overview
# ===================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Expected Friendship Network${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Accepted Friendships:${NC}"
echo "  • test0 ↔ test1, test2, test7"
echo "  • test1 ↔ test0, test2, test5, test8"
echo "  • test2 ↔ test0, test1, test3, test6"
echo "  • test3 ↔ test2, test4, test5"
echo "  • test4 ↔ test3, test5, test7"
echo "  • test5 ↔ test1, test3, test4, test6"
echo "  • test6 ↔ test2, test5"
echo "  • test7 ↔ test0, test4"
echo "  • test8 ↔ test1, test9"
echo "  • test9 ↔ test8"
echo ""
echo -e "${YELLOW}Pending Requests:${NC}"
echo "  • test6 → test7"
echo "  • test6 → test8"
echo "  • test7 → test9"
echo "  • test8 → test0"
echo "  • test9 → test0"
echo "  • test3 → test9"
echo "  • test4 → test9"
echo "  • test7 → test2"
echo "  • test5 → test8"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Test data generation complete!${NC}"
echo -e "${BLUE}========================================${NC}"
