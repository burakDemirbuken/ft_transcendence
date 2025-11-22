# Test profile query with SQL injection
curl -X GET "http://localhost:3006/profile?userName=admin'%20OR%20'1'='1" \
  -H "Authorization: Bearer YOUR_TOKEN"