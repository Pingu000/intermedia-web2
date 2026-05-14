# EXAMEN — Alejandro Montero

## Reto
F6 — updateDeliveryNote con control de estado firmado (409 Conflict) + tests

## Tarea técnica

### Qué problema detecté
En `src/controllers/deliverynote.controller.js` no existía una función `updateDeliveryNote` que permitiera editar albaranes pendientes y bloqueara la edición de los ya firmados. Además, en `signDeliveryNote` y `deleteDeliveryNote` se usaba `AppError.badRequest` (400) para el check de albarán firmado cuando el código HTTP semánticamente correcto es `AppError.conflict` (409), ya que el problema no es la petición sino el estado del recurso.

### Cómo lo arreglé
Implementé `updateDeliveryNote` siguiendo el patrón del resto de controladores: busca el albarán filtrando por `_id`, `company` y `deleted: false`, comprueba si `status === 'signed'` y lanza `AppError.conflict(409)` si lo está, y si no actualiza los campos permitidos (`description`, `hours`, `material`, `workdate`). Registré la ruta `PATCH /api/deliverynote/:id` con validación Zod (`updateDeliveryNoteSchema`) en `deliverynote.routes.js`. Corregí `signDeliveryNote` y `deleteDeliveryNote` para que usen `AppError.conflict` en lugar de `AppError.badRequest`. Creé 4 tests de integración con Jest y `mongodb-memory-server`.

### Por qué mi solución es correcta
La solución respeta la semántica HTTP: 409 Conflict indica un conflicto con el estado del recurso, no un error en la petición. El filtro multi-tenant (`company: req.user.company`) garantiza el aislamiento entre empresas. Los 4 tests validan los escenarios clave: actualización exitosa (200), bloqueo por firma en update (409), bloqueo por firma en delete (409), y aislamiento multi-tenant (404). El uso de `mongodb-memory-server` asegura tests reproducibles sin depender de una base de datos externa.

## Respuestas socráticas

### 1. ¿Por qué 400 Bad Request es incorrecto y 409 Conflict es el código semántico correcto?

La RFC 9110 define el código 400 (Bad Request) como: *"el servidor no puede o no quiere procesar la petición debido a algo que se percibe como un error del cliente (por ejemplo, sintaxis de la petición malformada, datos inválidos en el cuerpo, etc.)"*. En cambio, define el 409 (Conflict) como: *"la petición no se pudo completar debido a un conflicto con el estado actual del recurso destino"*. Cuando alguien intenta firmar un albarán que ya tiene `status: 'signed'`, la petición en sí es perfectamente válida: la sintaxis es correcta, el ID del albarán es real y la imagen de firma adjunta es una imagen legítima. El problema no está en los datos que envió el cliente, sino en que el recurso ya se encuentra en un estado (`signed`) que impide la operación. Por eso el 409 es el código correcto: comunica que el conflicto es con el estado del recurso, no con la petición del cliente. Un 400 sería engañoso porque le diría al frontend que corrija su petición, cuando en realidad no hay nada que corregir en ella.

### 2. EventEmitter vs WebSocket: ¿puede mi EventEmitter notificar al navegador?

La diferencia fundamental es el alcance: un `EventEmitter` de Node.js es un mecanismo de comunicación **intra-proceso**, donde los eventos se emiten y escuchan exclusivamente dentro del mismo proceso del servidor. En mi `notification.service.js`, los listeners solo hacen `console.log()`, es decir, los eventos nunca salen del servidor. Un WebSocket con Socket.IO, en cambio, establece una **conexión bidireccional persistente** entre el servidor y el navegador del cliente, permitiendo que el servidor envíe mensajes push sin que el cliente los solicite. Si un usuario abre la aplicación en el navegador y quiero notificarle en tiempo real de que se ha creado un nuevo albarán, mi `EventEmitter` no puede hacerlo porque no tiene ningún canal de comunicación con el navegador: el evento se dispara en el servidor, se imprime en la consola del servidor y muere ahí. Para conseguirlo necesitaría Socket.IO, que al recibir el evento del `EventEmitter` en el servidor, lo reemitiría a través del WebSocket al navegador del usuario conectado.

### 3. Problema de memoria sin paginación y modificación mínima

Sin `.skip()` ni `.limit()`, cuando `getClients` ejecuta `Client.find({ company: req.user.company, deleted: false })` con 10.000 clientes, MongoDB envía todos los documentos al driver de Node.js, que los deserializa uno a uno y los almacena como objetos JavaScript en el heap de V8. Esto provoca un pico de memoria proporcional al tamaño total de los datos: si cada documento ocupa ~2KB, estaríamos cargando ~20MB solo para una petición, y si hay varias peticiones concurrentes el consumo se multiplica, pudiendo provocar lentitud extrema o un crash por Out-of-Memory. La modificación mínima para añadir paginación sería:

```js
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const clients = await Client.find({
  company: req.user.company,
  deleted: false,
}).skip(skip).limit(limit);
```

Así cada respuesta devuelve como máximo `limit` documentos, y el cliente puede navegar entre páginas con `?page=2&limit=20`.

### 4. Índice compuesto para DeliveryNote

Sin ningún índice explícito, MongoDB realiza un **collection scan** (COLLSCAN): recorre los 100.000 documentos uno por uno, comprueba cuáles tienen el `company` correcto y luego ordena el resultado por `workdate`. Es decir, examina los **100.000 documentos completos** independientemente de cuántos pertenezcan a esa empresa. El índice compuesto que añadiría sería:

```js
deliveryNoteSchema.index({ company: 1, workdate: -1 });
```

El orden importa: primero `company` porque es el campo de **igualdad** (filtramos por un valor exacto), y después `workdate` con `-1` (descendente) porque es el campo de **ordenación**. Con este índice, MongoDB puede ir directamente a la porción del índice correspondiente a esa empresa y recorrer los documentos ya ordenados por fecha, pasando de examinar 100.000 documentos a examinar solo los que pertenecen a esa empresa, con coste O(log n) para la búsqueda.

### 5. ¿Por qué 404 y no 403 en multi-tenancy?

Devolver un 404 en vez de un 403 es una decisión deliberada de seguridad. Si devolviéramos un 403 (Forbidden) cuando el albarán existe pero pertenece a otra compañía, le estaríamos confirmando al atacante que **el recurso con ese ID sí existe** en el sistema, solo que no tiene permiso para accederlo. Esta información es valiosa: un atacante podría iterar sobre IDs (por ejemplo `/api/deliverynote/1`, `/api/deliverynote/2`, etc.) y distinguir entre un 404 (no existe) y un 403 (existe pero es de otro) para construir un mapa de todos los albaranes existentes en la plataforma, saber cuántos hay y potencialmente inferir información sobre otras empresas. Con un 404, la respuesta es ambigua: el atacante no puede distinguir entre "ese albarán no existe" y "ese albarán existe pero es de otra empresa". Este patrón se conoce como **seguridad por ocultación del recurso** y es una práctica estándar en APIs multi-tenant para evitar la enumeración de recursos entre tenants.

## Proceso
Tiempo total invertido en la practica: [Alrededor de 7 dias]
Herramientas usadas: [VSCode, apunte de case, W3Schools., Herramientas de IA como Claude]

