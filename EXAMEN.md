# EXAMEN — Alejandro Tortosa

## Reto
F6 — updateDeliveryNote con control de estado firmado (409 Conflict) + tests

## Tarea técnica

### Qué problema detecté
El controlador de albaranes no tenía una función `updateDeliveryNote` que permitiera editar albaranes antes de ser firmados y lo bloqueara después. Además, en `signDeliveryNote` y `deleteDeliveryNote` se usaba `AppError.badRequest` (400) en vez de `AppError.conflict` (409) cuando el albarán ya estaba firmado, lo cual es semánticamente incorrecto porque el problema no es que la petición esté mal formada, sino que hay un conflicto con el estado actual del recurso.

### Cómo lo arreglé
1. Implementé `updateDeliveryNote` en `src/controllers/deliverynote.controller.js` con un check de `status === 'signed'` que lanza `AppError.conflict` (409) si el albarán ya está firmado, y actualiza los campos permitidos (description, hours, material, workdate) si no lo está.
2. Registré la ruta `PATCH /api/deliverynote/:id` en `src/routes/deliverynote.routes.js` con validación Zod mediante `updateDeliveryNoteSchema`.
3. Corregí `signDeliveryNote` y `deleteDeliveryNote` para que usen `AppError.conflict` en lugar de `AppError.badRequest` cuando el albarán ya está firmado.
4. Creé `tests/deliverynote.test.js` con 4 tests de integración usando `mongodb-memory-server` para un entorno aislado.

### Por qué mi solución es correcta
La solución respeta la semántica HTTP: un 409 Conflict indica que la petición no puede procesarse debido al estado actual del recurso, no porque los datos enviados sean inválidos. Los tests validan los 4 escenarios clave: actualización exitosa, bloqueo por firma en update, bloqueo por firma en delete, y aislamiento multi-tenant. El uso de `mongodb-memory-server` garantiza que los tests son reproducibles y no dependen de una base de datos externa.

## Respuestas socráticas

### 1. ¿Por qué 400 Bad Request es incorrecto y 409 Conflict es correcto?
Según la RFC 9110, el código 400 (Bad Request) indica que el servidor no puede procesar la petición porque la sintaxis de la petición es inválida o los datos enviados son incorrectos. En cambio, el código 409 (Conflict) indica que la petición no se puede completar debido a un conflicto con el estado actual del recurso. Cuando un albarán ya está firmado y alguien intenta editarlo o firmarlo de nuevo, la petición en sí es perfectamente válida (la sintaxis es correcta, los datos son legítimos), pero el recurso está en un estado que impide la operación. Por tanto, 409 es el código semánticamente correcto porque comunica al cliente que el problema no está en su petición sino en el estado del recurso, y 400 sería engañoso porque sugeriría que debe corregir los datos enviados.

### 2. EventEmitter vs WebSocket
Un `EventEmitter` de Node.js es un mecanismo de comunicación intra-proceso: los eventos se emiten y se escuchan dentro del mismo proceso del servidor. Un WebSocket (Socket.IO) es un protocolo de comunicación bidireccional entre el servidor y el navegador del cliente a través de una conexión persistente. Mi `EventEmitter` no puede notificar al navegador en tiempo real porque los listeners están en el propio servidor (solo hacen `console.log`). Para notificar a un usuario en su navegador de que se ha creado un nuevo albarán, necesitaría Socket.IO, que mantiene una conexión abierta con el cliente y puede enviarle mensajes push sin que el cliente los solicite.

### 3. Paginación y memoria
Sin `.skip()` ni `.limit()`, `Client.find()` carga los 10.000 documentos completos en memoria de una sola vez. MongoDB envía todos los documentos al driver de Node.js, que los deserializa y los almacena como objetos JavaScript en el heap, lo cual puede causar un pico de memoria significativo e incluso un crash por Out-of-Memory. La modificación mínima sería:
```js
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;
const clients = await Client.find({ company: req.user.company, deleted: false }).skip(skip).limit(limit);
```
Esto limita cada respuesta a un máximo de `limit` documentos, y `skip` salta los documentos de las páginas anteriores.

### 4. Índices en DeliveryNote
Sin índice, MongoDB realiza un **collection scan** (COLLSCAN): examina los 100.000 documentos uno por uno para filtrar por `company` y ordenar por `workdate`. Esto es O(n) en lectura y extremadamente ineficiente. El índice compuesto que añadiría sería `{ company: 1, workdate: -1 }`, en ese orden, porque primero filtramos por `company` (igualdad) y luego ordenamos por `workdate` descendente. MongoDB puede usar este índice para hacer ambas operaciones sin escanear la colección completa, reduciendo el coste de la query de O(n) a O(log n). Si además filtráramos frecuentemente por `deleted`, el índice podría ser `{ company: 1, deleted: 1, workdate: -1 }`.

### 5. ¿Por qué 404 y no 403 en multi-tenancy?
Devolver 404 (Not Found) es más seguro que 403 (Forbidden) en un contexto multi-tenant porque un 403 le confirma al atacante que el recurso existe, solo que no tiene permiso para accederlo. Eso revela información: el atacante sabe que el ID es válido y pertenece a otra empresa, y podría usar esa información para enumerar recursos ajenos. Un 404, en cambio, es ambiguo: el atacante no sabe si el recurso no existe o si existe pero pertenece a otra empresa. Este patrón se llama "seguridad por ocultación" y es una práctica estándar en APIs multi-tenant para evitar la fuga de información sobre la existencia de recursos entre tenants.

## Proceso
Tiempo total invertido: 45 minutos
Herramientas usadas: VS Code, Gemini (asistente IA)
Prompts a IA (si aplica, copia literal):
- "Estoy ahora mismo en la defensa del examen. La profesora me ha pedido realizar unos retos que tengo que hacer. Algunos creo que ya estan implementandos por claude, revisalos para ver si estan bien, tengo que completar todo lo que me pide en el enunciado."
