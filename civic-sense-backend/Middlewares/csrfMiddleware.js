const crypto = require("crypto");

const generateCSRFToken = (req, res) => {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrfToken", token, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    })

    return res.json({ csrfToken: token })
}

const verifyCsrfToken = (req, res, next) => {
    const headerToken = req.headers["x-csrf-token"];
    const cookieToken = req.cookies.csrfToken;

    if (!headerToken || !cookieToken) {
        return res.status(403).json({ status: "error", message: "CSRF token is missing" })
    }

    if (headerToken !== cookieToken) {
        return res.status(403).json({ status: "error", message: "CSRF validation failed" })
    }

    next();
}

module.exports = {
    generateCSRFToken,
    verifyCsrfToken
}