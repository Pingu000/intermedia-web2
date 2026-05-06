import { EventEmitter } from 'events';

class NotificationService extends EventEmitter {}

export const notificationService = new NotificationService();

notificationService.on('user:registered', (data) => {
  console.log(`[EVENTO] Nuevo usuario registrado: ${data.email}`);
});

notificationService.on('user:verified', (data) => {
  console.log(`[EVENTO] Usuario verificado correctamente: ${data.email}`);
});

notificationService.on('user:invited', (data) => {
  console.log(`[EVENTO] Usuario invitado: ${data.email} a la compañía ID: ${data.companyId}`);
});

notificationService.on('user:deleted', (data) => {
  console.log(`[EVENTO] Usuario eliminado. Email: ${data.email} | Soft delete: ${data.softDelete}`);
});
