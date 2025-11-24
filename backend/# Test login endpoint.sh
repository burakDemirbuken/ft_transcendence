# Test login endpoint
sqlmap -u "http://localhost:3000/auth/login" \
  --data='{"login":"test","password":"test"}' \
  --method=POST \
  --headers="Content-Type: application/json" \
  --level=5 \
  --risk=3

# Test GET parameter
sqlmap -u "http://localhost:3000/check-username?username=test" \
  --level=5 \
  --risk=3 \
  --batch