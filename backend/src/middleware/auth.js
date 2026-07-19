import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kampung-merak-secret-key-2026";

export function generateToken(user) {
  return jwt.sign({ uid: user.uid, nama: user.nama, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token tidak ditemukan" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid atau kedaluwarsa" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Akses ditolak. Diperlukan role: ${roles.join(", ")}` });
    }
    next();
  };
}