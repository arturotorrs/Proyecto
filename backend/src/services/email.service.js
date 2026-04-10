const nodemailer = require('nodemailer');

function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Envía el correo de restablecimiento de contraseña.
 * Si no hay SMTP configurado, imprime el enlace en consola.
 */
async function sendPasswordReset(toEmail, resetUrl) {
  const transport = createTransport();

  if (!transport) {
    console.log('\n──────────────────────────────────────────────');
    console.log('  SMTP no configurado — enlace de recuperación:');
    console.log(' ', resetUrl);
    console.log('──────────────────────────────────────────────\n');
    return;
  }

  await transport.sendMail({
    from: `"IMSS Inventario" <${process.env.SMTP_FROM || 'no-reply@imss.gob.mx'}>`,
    to: toEmail,
    subject: 'Restablecimiento de contraseña — IMSS Inventario',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <div style="background:#006455;padding:20px;text-align:center">
          <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;letter-spacing:1px">
            IMSS — INVENTARIO DE INSUMOS
          </p>
        </div>
        <div style="padding:32px;border:1px solid #e5e7eb">
          <p style="color:#374151;font-size:15px">
            Recibiste este correo porque solicitaste restablecer tu contraseña.
            Haz clic en el botón para continuar. El enlace expira en <strong>1 hora</strong>.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}"
               style="background:#006455;color:#fff;padding:12px 28px;border-radius:8px;
                      text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:.5px">
              Restablecer contraseña
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px">
            Si no solicitaste este cambio puedes ignorar este correo.<br>
            El enlace caducará automáticamente.
          </p>
        </div>
        <div style="background:#C9A84C;padding:10px;text-align:center">
          <p style="color:#fff;font-size:11px;margin:0">
            Instituto Mexicano del Seguro Social — Seguridad y Solidaridad Social
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendPasswordReset };
