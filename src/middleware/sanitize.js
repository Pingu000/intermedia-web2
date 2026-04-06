/**
 * Middleware para sanear (limpiar) los datos de entrada y evitar inyecciones NoSQL.
 * Se encarga de buscar y eliminar cualquier clave en el JSON que empiece por el símbolo del dólar ($),
 * que es el que usa MongoDB para sus comandos internos (por ejemplo: $gt, $eq, $ne).
 */

const cleanData = (obj) => {
  // Si no es un objeto o es nulo, no hacemos nada
  if (!obj || typeof obj !== 'object') return;

  // Recorremos todas las propiedades del objeto (body, params o query)
  for (const key in obj) {
    if (key.startsWith('$')) {
      // Si la clave es un operador de Mongo, la borramos sin piedad
      delete obj[key];
    } else {
      // Si el valor es otro objeto dentro del objeto, llamamos a la función de forma recursiva (recursividad)
      cleanData(obj[key]);
    }
  }
};

export const manualMongoSanitize = (req, res, next) => {
  // Limpiamos los 3 sitios por donde el frontal nos puede colar cosas raras
  if (req.body) cleanData(req.body);
  if (req.query) cleanData(req.query);
  if (req.params) cleanData(req.params);
  
  next();
};
