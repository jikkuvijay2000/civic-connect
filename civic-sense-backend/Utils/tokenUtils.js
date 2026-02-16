const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    )
}

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    )
}

const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setAuthCookies
}