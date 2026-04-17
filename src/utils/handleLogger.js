import { IncomingWebhook } from '@slack/webhook';

const webhook = process.env.SLACK_WEBHOOK
  ? new IncomingWebhook(process.env.SLACK_WEBHOOK)
  : null;

// Stream compatible con morgan-body para logs en consola
export const loggerStream = {
  write: (message) => {
    console.error(message);
  }
};

// Funcion para enviar errores 5XX a Slack con toda la info que pide el enunciado
export const sendSlackError = async (err, req) => {
  if (!webhook) return;

  const timestamp = new Date().toISOString();
  const method = req?.method || 'UNKNOWN';
  const route = req?.originalUrl || 'UNKNOWN';
  const message = err?.message || 'Error desconocido';
  const stack = err?.stack || 'Sin stack trace';

  try {
    await webhook.send({
      text: `*Error 5XX en la API*\n*Timestamp:* ${timestamp}\n*Metodo:* ${method}\n*Ruta:* ${route}\n*Error:* ${message}\n*Stack:*\n\`\`\`${stack}\`\`\``
    });
  } catch (slackErr) {
    console.error('Error enviando a Slack:', slackErr);
  }
};

// Funcion para enviar mensajes puntuales a Slack desde cualquier parte del codigo
export const sendSlackNotification = async (message) => {
  if (!webhook) return;
  try {
    await webhook.send({ text: message });
  } catch (err) {
    console.error('Error enviando a Slack:', err);
  }
};
