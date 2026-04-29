import nodemailer from 'nodemailer';

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Envía un email con el código de validación al registrarse
   * @param {string} to - Email del destinatario
   * @param {string} code - Código de 6 dígitos
   */
  async sendValidationCode(to, code) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"BildyApp" <noreply@bildyapp.com>',
        to,
        subject: 'Código de Verificación - BildyApp',
        html: `
          <h1>¡Bienvenido a BildyApp!</h1>
          <p>Tu código de verificación es:</p>
          <h2>${code}</h2>
          <p>Por favor, introdúcelo en la aplicación para activar tu cuenta.</p>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[MAIL] Correo enviado a ${to}. MessageId: ${info.messageId}`);
    } catch (error) {
      console.error('[MAIL] Error al enviar correo:', error.message);
      // No lanzamos el error para no bloquear el registro si falla el correo en desarrollo
    }
  }
}

export const mailService = new MailService();
