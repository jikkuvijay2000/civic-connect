const jwt = require("jsonwebtoken");

const User = require("../Models/User");

const protect = async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ status: "error", message: "Unauthorized" })
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetch user from DB to get latest role and department
        const user = await User.findById(decodedToken.userId).select("-userPassword");

        if (!user) {
            return res.status(401).json({ status: "error", message: "User not found" });
        }

        req.user = user;
        next();

    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message })
    }
}

const verifyAuthority = (req, res, next) => {
    if (req.user && req.user.userRole === 'Authority') {
        next();
    } else {
        return res.status(403).json({ status: "error", message: "Access denied: Authorities only" });
    }
}

module.exports = {
    protect,
    verifyAuthority
}