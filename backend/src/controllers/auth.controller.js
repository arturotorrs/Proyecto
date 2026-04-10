const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const { sendPasswordReset } = require("../services/email.service");

// Crear tabla si no existe (migración ligera)
db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now'))
  )
`);

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
}

function signRefreshToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  try {
    const user = db
      .prepare(
        "SELECT id, nombre, email, password_hash, rol FROM users WHERE email = ?",
      )
      .get(email.toLowerCase().trim());

    if (!user) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectas" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectas" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token requerido" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = db
      .prepare("SELECT id, nombre, email, rol FROM users WHERE id = ?")
      .get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Refresh token inválido o expirado" });
  }
}

function logout(req, res) {
  res.json({ message: "Sesión cerrada exitosamente" });
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "El correo es requerido" });

  try {
    const user = db
      .prepare("SELECT id, email, nombre FROM users WHERE email = ?")
      .get(email.toLowerCase().trim());

    // Siempre responde igual para no revelar si el correo existe
    if (!user) {
      return res.json({
        message: "Si el correo está registrado recibirás las instrucciones.",
      });
    }

    // Invalidar tokens anteriores del usuario
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(
      user.id,
    );

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    db.prepare(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    ).run(user.id, token, expiresAt);

    const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password?token=${token}`;
    await sendPasswordReset(user.email, resetUrl);

    res.json({
      message: "Si el correo está registrado recibirás las instrucciones.",
    });
  } catch (err) {
    console.error("Error en forgotPassword:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) {
    return res
      .status(400)
      .json({ error: "Token y nueva contraseña son requeridos" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const record = db
      .prepare(
        "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0",
      )
      .get(token);

    if (!record) {
      return res
        .status(400)
        .json({ error: "El enlace no es válido o ya fue utilizado" });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res
        .status(400)
        .json({ error: "El enlace ha expirado. Solicita uno nuevo." });
    }

    const hash = await bcrypt.hash(password, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      hash,
      record.user_id,
    );
    db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(
      record.id,
    );

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en resetPassword:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { login, refresh, logout, forgotPassword, resetPassword };
