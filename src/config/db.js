import mongoose from 'mongoose';

// Usaremos async/await tal como indica la teoría T2 y T5
const dbConnect = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('No se ha definido MONGO_URI en el archivo .env');
    
    // Conectarmos a Mongoose, esto conecta de forma global
    await mongoose.connect(uri);
    console.log('[Base de Datos] Conexión a MongoDB Atlas (o local) exitosa');
  } catch (error) {
    console.error('[Base de Datos] Error conectando a la base de datos', error);
    process.exit(1);
  }
};

export default dbConnect;
