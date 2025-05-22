const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// In-memory user store
// Structure: { username: { password: '...', otherFieldsOptional } }
const users = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Registration endpoint
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if(!username || !password){
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }
  if(users[username]){
    return res.status(400).json({ success: false, message: 'Username already taken.' });
  }
  
  // Store user (in-memory, no hashing for demo only)
  users[username] = { password };
  
  return res.json({ success: true, message: 'Successfully registered, please log in.' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if(!username || !password){
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }
  
  const user = users[username];
  if(!user || user.password !== password){
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }
  
  // For demo, no session or tokens, just success
  return res.json({ success: true, message: 'Login successful.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

