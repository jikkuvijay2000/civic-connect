const verifyAdminSecret = (req, res, next) => {
    const secret = req.headers['x-admin-secret'] || req.query.secret || req.params.secret;
    const adminSecret = process.env.ADMIN_SETUP_SECRET;

    if (!adminSecret) {
        return res.status(500).json({ status: "error", message: "Admin secret not configured on server" });
    }

    if (secret === adminSecret) {
        next();
    } else {
        res.status(403).json({ status: "error", message: "Unauthorized: Invalid admin secret" });
    }
};

module.exports = { verifyAdminSecret };
