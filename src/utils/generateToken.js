const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate a test token
const token = jwt.sign(
  { 
    userId: 'test-user-1',
    email: 'test@example.com'
  }, 
  process.env.JWT_SECRET || 'your-secret-key',
  { 
    expiresIn: '24h' 
  }
);

console.log('Test JWT Token:');
console.log(token);
