import { validationResult } from 'express-validator';

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return res.status(400).json({ success: false, message: errorMessages });
    }
    next();
};

export default validateRequest;
