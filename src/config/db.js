import mongoose from 'mongoose';

const dbConnect = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('No se ha definido MONGO_URI en el archivo .env');
    
    await mongoose.connect(uri);
    console.log('[Base de Datos] Conexión a MongoDB Atlas (o local) exitosa');
  } catch (error) {
    console.error('[Base de Datos] Error conectando a la base de datos', error);
    process.exit(1);
  }
};

export default dbConnect;
