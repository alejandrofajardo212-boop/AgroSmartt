# AgroSmart

Plataforma de agricultura inteligente con frontend Vue 3 + Quasar y API Node.js + Express. Esta primera etapa utiliza datos mock persistidos localmente en JSON; la API se comunica con una capa de repositorio para facilitar el reemplazo por MongoDB sin acoplar los controladores al almacenamiento.

## Estructura

```text
AgroSmart/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── config/          # Variables de entorno
│   │       ├── controllers/     # Validación y respuestas HTTP
│   │       ├── data/            # Datos iniciales de demostración
│   │       ├── middleware/      # JWT, roles y errores
│   │       ├── repositories/    # Adaptador de persistencia JSON (sustituible por Mongo)
│   │       ├── routes/          # Rutas versionables de la API
│   │       ├── services/        # Autenticación y lógica de negocio
│   │       └── utils/
│   └── web/
│       └── src/
│           ├── api/             # Cliente Axios
│           ├── components/      # Componentes Quasar reutilizables
│           ├── css/
│           ├── layouts/
│           ├── pages/
│           ├── router/
│           └── stores/          # Estado Pinia
├── package.json
└── README.md
```

## Inicio rápido

Requiere Node.js 20 o posterior.

```powershell
npm install
Copy-Item apps\api\.env.example apps\api\.env
npm run dev
```

La interfaz estará en `http://localhost:9000` y la API en `http://localhost:3000/api`. En desarrollo se crea la cuenta de demostración `demo@agrosmart.com` con contraseña `AgroSmart2026!` si aún no existe. El servidor de desarrollo debe usar el secreto de JWT predeterminado solo en local.

Para la API en producción, configura `JWT_SECRET` con un secreto aleatorio de al menos 32 caracteres. El archivo de datos se crea por defecto en `apps/api/data/agrosmart.json`; `DATA_FILE` permite cambiar su ubicación.

## API inicial

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/terrains`, `GET /api/crops`, `GET /api/sensors` con `page` y `limit`
- `POST /api/terrains` y `PATCH /api/terrains/:id` (roles `Admin` y `SuperAdmin`)

Las rutas privadas requieren `Authorization: Bearer <token>`. El registro está disponible desde `/registro` y siempre asigna el rol `Usuario`; los privilegios administrativos nunca se aceptan desde el cuerpo del cliente.

## Seguridad y evolución

Las contraseñas se almacenan con bcrypt y el token no contiene credenciales. En este prototipo el token de sesión se conserva en `localStorage` para mantener la sesión; localStorage es accesible desde JavaScript y no es adecuado frente a XSS en producción. Para el despliegue, se recomienda migrar a cookies `HttpOnly`, `Secure` y `SameSite`, además de aplicar TLS y una política CSP.

`JsonRepository` es un adaptador de demostración, no una base transaccional multiusuario. Las operaciones se serializan en un archivo JSON; al conectar MongoDB, implementa la misma interfaz con esquemas e índices, y utiliza sesiones/transacciones de MongoDB allí donde una operación abarque varias escrituras. Los errores HTTP 5xx se registran en servidor y se responden sin detalles internos.

## Verificación

```powershell
npm test
npm run build
```
