const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Token invalid" });

      req.user = user;
      next();
    });
  } else res.status(401).json({ error: "Authorization token required" });
}

module.exports = authenticateToken;
