/**
 * Global error handling middleware.
 * Catches errors passed via next(error) from any route/controller.
 * In production, stack traces are suppressed.
 */
const errorHandler = (err, req, res, next) => {
    // Determine the appropriate status code
    let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    // Handle specific error types
    if (err.name === "ValidationError") {
        // Mongoose validation error
        statusCode = 400;
    } else if (err.name === "CastError") {
        // Mongoose invalid ObjectId
        statusCode = 400;
        err.message = `Invalid ID format: ${err.value}`;
    } else if (err.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        err.message = `A record with this ${field} already exists.`;
    } else if (err.name === "MulterError") {
        statusCode = 400;
    }

    const isProduction = process.env.NODE_ENV === "production";

    res.status(statusCode).json({
        success: false,
        message: err.message || "An unexpected error occurred.",
        ...(isProduction ? {} : { stack: err.stack }),
    });
};

export default errorHandler;
