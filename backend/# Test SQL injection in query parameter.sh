# Test SQL injection in query parameter
curl "http://localhost:3000/check-username?username=admin'%20OR%20'1'='1"

# Test with semicolon
curl "http://localhost:3000/check-username?username=admin';DROP%20TABLE%20users;--"

# Test with UNION
curl "http://localhost:3000/check-username?username=admin'%20UNION%20SELECT%20*%20FROM%20users--"