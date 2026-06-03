import jwt from "jsonwebtoken";

/**
 * User authentication middleware.
 * Reads JWT from the Authorization header (Bearer token standard).
 * Injects decoded userId into req.userId for downstream handlers.
 */
const authUser = async (req, res, next) => {
    // Support both "Authorization: Bearer <token>" and legacy custom "token" header
    const authHeader = req.headers.authorization;
    const legacyToken = req.headers.token;

    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (legacyToken) {
        // Legacy support — will be removed in a future version
        token = legacyToken;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach to req directly instead of mutating req.body
        req.userId = decoded.id;
        // Also set on req.body for backward compatibility with existing controllers
        req.body = req.body || {};
        req.body.userId = decoded.id;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ success: false, message: "Invalid token. Please log in again." });
    }
};

export default authUser;
