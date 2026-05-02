import app from './app.js';
import dbConnect from './config/db.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;
let server;

const startServer = async () => {
  try {
    await dbConnect();
    
    server = app.listen(PORT, () => {
      console.log(`[Servidor] Escuchando en el puerto ${PORT}`);
      console.log(`[Servidor] Puedes probar la API en http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Error] Fallo crítico al arrancar la BD...', error);
    process.exit(1);
  }
};

startServer();

// --- Apagado controlado (Graceful Shutdown) ---
const gracefulShutdown = async () => {
  console.log('[Servidor] Apagando el servidor de forma controlada...');
  
  if (server) {
    server.close(async () => {
      console.log('[Servidor] Conexiones HTTP cerradas.');
      try {
        await mongoose.connection.close();
        console.log('[BD] Conexión a base de datos cerrada.');
        process.exit(0);
      } catch (err) {
        console.error('[BD] Error al cerrar la conexión:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
