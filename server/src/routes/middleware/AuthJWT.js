const jwt = require('jsonwebtoken');

function AuthJwt(req, res, next) {
    const token = req.cookies.jwt;  // <-- direct read

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

module.exports = AuthJwt;