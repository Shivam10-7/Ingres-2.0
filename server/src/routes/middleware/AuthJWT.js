const jwt = require('jsonwebtoken');

function AuthJwt(req, res, next) {
    console.log("Middleware START");
    try {
        let token;

        // 1. Get token from cookie
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        // 2. Fallback: Authorization header
        else if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }
        console.log("TOKEN:", token);
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // ✅ 4. Attach decoded data to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };
        console.log("Middleware BEFORE NEXT");
        next();

    } catch (err) {
        console.error("AUTH ERROR:", err);

        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
};

module.exports = AuthJwt;