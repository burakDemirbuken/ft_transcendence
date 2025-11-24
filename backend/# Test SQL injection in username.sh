# Test SQL injection in username
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test'\'' OR '\''1'\''='\''1", "email": "test@test.com", "password": "Test123!"}'

# Test SQL injection in email
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test'\''@test.com", "password": "Test123!"}'