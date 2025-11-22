# Test friend operations
curl -X POST http://localhost:3005/friend/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"friendName": "test'\'' OR '\''1'\''='\''1"}'