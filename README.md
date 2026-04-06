# BildyApp API

Backend de la práctica intermedia de Web 2. API REST para gestión de usuarios hecha con Node.js, Express y MongoDB.

## Instalación

Clona el repo e instala las dependencias:

```bash
npm install
```

Crea un archivo `.env` en la raíz copiando el `.env.example` y rellena los valores:

```bash
cp .env.example .env
```

Las variables que necesitas configurar son:

```
MONGO_URI=       # tu cadena de conexión de MongoDB Atlas
PORT=3000
JWT_SECRET=      # cualquier string largo y aleatorio
JWT_REFRESH_SECRET=   # otro string distinto al anterior
```

## Arrancar el servidor

```bash
npm run dev
```

Si todo va bien verás en consola que conecta a MongoDB y que el servidor está escuchando en el puerto 3000. Puedes hacer una prueba rápida entrando a `http://localhost:3000/api/health`.

## Probar los endpoints

En la raíz del proyecto hay un archivo `pruebas_api.http` con ejemplos de todas las peticiones. Puedes usarlo con la extensión REST Client de VS Code.

El orden recomendado para probar el flujo completo es:

1. Registro (`POST /api/user/register`) → guarda el accessToken de la respuesta
2. Valida el email (`PUT /api/user/validation`) → el código de 6 dígitos sale en la consola del servidor
3. Login (`POST /api/user/login`)
4. Rellena datos personales (`PUT /api/user/register`)
5. Crea o únete a una empresa (`PATCH /api/user/company`)
6. Sube el logo de la empresa (`PATCH /api/user/logo`)

## Estructura del proyecto

```
src/
├── config/         # conexión a la base de datos
├── controllers/    # lógica de cada endpoint
├── middleware/     # auth, roles, validación, subida de archivos, errores
├── models/         # esquemas de Mongoose (User, Company)
├── routes/         # definición de rutas
├── services/       # servicio de notificaciones con EventEmitter
├── utils/          # clase AppError
└── validators/     # esquemas de validación con Zod
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `MONGO_URI` | Cadena de conexión a MongoDB Atlas |
| `PORT` | Puerto donde corre el servidor (por defecto 3000) |
| `JWT_SECRET` | Secreto para firmar los access tokens |
| `JWT_REFRESH_SECRET` | Secreto para firmar los refresh tokens |