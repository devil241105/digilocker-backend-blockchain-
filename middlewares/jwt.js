import jwt from 'jsonwebtoken';


export const jwtAuthMiddleware = (req, res, next) => {
    let token = null;

    if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).json({ error: 'Token not found' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const generateToken = (userData) => {
    return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '24h' });
};