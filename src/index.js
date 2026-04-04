import app from './app.js';
import dbConnect from './config/db.js';

// Punto de entrada de nuestra aplicación (T1)
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Primero conectamos a la BD
    await dbConnect();
    
    // 2. Si la BD conecta, entonces arrancamos nuestro servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor vivito y coleando en el puerto ${PORT}`);
      console.log(`📚 Puedes probar la API en http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error crítico al arrancar la BD, me apago...', error);
    process.exit(1);
  }
};

startServer();
