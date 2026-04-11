// utils/setTokenCookie.js
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in prod
    sameSite: "Strict",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

module.exports = setTokenCookie;