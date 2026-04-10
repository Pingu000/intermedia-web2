import { IncomingWebhook } from '@slack/webhook';

// Instanciamos el webhook solo si existe la variable de entorno (asi no peta en local sin configurar)
const webhook = process.env.SLACK_WEBHOOK
  ? new IncomingWebhook(process.env.SLACK_WEBHOOK)
  : null;

// Stream compatible con morgan-body para redirigir los logs de error a Slack
export const loggerStream = {
  write: (message) => {
    if (webhook) {
      webhook.send({
        text: `*Error en API*\n\`\`\`${message}\`\`\``
      }).catch(err => console.error('Error enviando a Slack:', err));
    }
    console.error(message);
  }
};

// Funcion para enviar notificaciones puntuales directamente desde cualquier sitio
export const sendSlackNotification = async (message) => {
  if (webhook) {
    try {
      await webhook.send({ text: message });
    } catch (err) {
      console.error('Error enviando a Slack:', err);
    }
  }
};
