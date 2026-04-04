import { EventEmitter } from 'events';

// Implementamos un servicio de notificaciones usando el patrón EventEmitter (T2)
class NotificationService extends EventEmitter {}

// Exportamos una única instancia (Singleton)
export const notificationService = new NotificationService();

// ============================================
// Listeners (Escuchadores de eventos)
// ============================================

notificationService.on('user:registered', (data) => {
  console.log(`[EVENTO] 👤 Nuevo usuario registrado: ${data.email}`);
  // En el futuro (final), aquí haríamos fetch a la API de Slack
});

notificationService.on('user:verified', (data) => {
  console.log(`[EVENTO] ✅ Usuario verificado correctamente: ${data.email}`);
});

notificationService.on('user:invited', (data) => {
  console.log(`[EVENTO] ✉️  Usuario invitado: ${data.email} a la compañía ID: ${data.companyId}`);
});

notificationService.on('user:deleted', (data) => {
  console.log(`[EVENTO] 🗑️  Usuario eliminado. Email: ${data.email} | Soft delete: ${data.softDelete}`);
});
