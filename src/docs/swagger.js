import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API de BildyApp - Express con Swagger',
      version: '1.0.0',
      description: 'Documentación interactiva de la API de BildyApp para la Práctica Final',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local de Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  // Archivos donde Swagger buscará los comentarios JSDoc
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);
