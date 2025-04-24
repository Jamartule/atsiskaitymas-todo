const jwt = require('jsonwebtoken');
const JWT_SECRET = 'tavo_super_slaptas_raktas';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Tikrinam, ar yra Bearer tokenas
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Tokenas nerastas' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Tokenas nebegalioja' });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
