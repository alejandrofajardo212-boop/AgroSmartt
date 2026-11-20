# AgroSmart

Aplicación responsive para administrar una operación agrícola con Vue 3, Quasar y Pinia. La plataforma funciona en esta fase con un backend lógico simulado en el navegador y persistencia en `localStorage`; no necesita MongoDB ni el servidor Express para guardar su información de demostración.

## Arquitectura

```text
AgroSmart/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── backend/
│   │       │   ├── controllers/  # Coordinación de acciones locales
│   │       │   ├── data/         # Datos de demostración y sesión local
│   │       │   ├── models/       # Roles, permisos y esquemas de módulos
│   │       │   ├── repositories/ # Persistencia en LocalStorage
│   │       │   ├── routes/       # Fachada local para la UI
│   │       │   └── services/     # Autenticación y reglas de negocio
│   │       ├── components/       # Componentes Quasar reutilizables
│   │       ├── layouts/
│   │       ├── pages/
│   │       ├── router/           # Rutas y guardas por rol
│   │       └── stores/           # Estado Pinia
│   └── api/                      # API Express modular de referencia
└── package.json
```

La UI llama a `backend/routes/localApi.js`, no a la API HTTP. Los controladores y servicios dependen del repositorio local, de modo que la capa de persistencia puede sustituirse al conectar una API real.

## Iniciar la aplicación

Requiere Node.js 20 o posterior.

```powershell
npm install
npm run dev
```

Abre `http://localhost:9000`. La API Express de referencia se inicia también en `http://localhost:3000/api`; la aplicación local puede seguir operando aunque esa API no esté disponible. La configuración de Vite reenvía `/api` a Express para las futuras pantallas conectadas a HTTP.

## Cuentas de demostración e inicio de sesión

Hay cuatro cuentas de demostración disponibles sin registrar usuarios ni guardar sus datos en el navegador o en el repositorio de la API. Selecciona el perfil indicado e inicia sesión con estas credenciales:

| Perfil | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@agrosmart.com` | `Admin2026!` |
| Trabajador / Operario | `operario@agrosmart.com` | `Operario2026!` |
| Ingeniero agrónomo / Técnico | `agronomo@agrosmart.com` | `Agronomo2026!` |
| Contador / Encargado financiero | `contador@agrosmart.com` | `Contador2026!` |

Las cuentas semilla y sus hashes viven en `apps/shared/seedUsers.js`; las contraseñas no se almacenan allí en texto plano. No hay registro público: **solo el Administrador crea cuentas**, desde el módulo **Usuarios**, y les asigna su rol (Administrador, Trabajador / Operario, Ingeniero agrónomo / Técnico o Contador / Encargado financiero) con una contraseña temporal. Estas cuentas se guardan en `localStorage` hasta conectar una base de datos. En la API, `POST /api/auth/register` exige una sesión de administrador (token `Bearer`) y un `role` válido.

Se impide mantener sesiones activas simultáneas para la misma cuenta o perfil. Cierra sesión desde el icono del usuario para liberar el acceso. El cierre borra las claves de sesión, pero conserva las cuentas registradas y los datos de la plataforma.

## Módulos por perfil

- **Administrador:** todos los módulos, gestión de usuarios y reportes.
- **Trabajador / Operario:** fincas, cultivos, actividades, tareas, cosechas y novedades.
- **Ingeniero agrónomo / Técnico:** fincas, cultivos, sensores, actividades, recomendaciones y plagas/enfermedades.
- **Contador / Encargado financiero:** gastos, ingresos y costos de producción.

Las rutas también verifican el perfil; no basta con ocultar opciones del menú. Cada finca muestra coordenadas y los cultivos/sensores relacionados que puede consultar el perfil actual.

## Persistencia y formularios

Los registros se almacenan bajo `agrosmart.local.data.v1`; las sesiones y bloqueos se guardan por separado. Los formularios de alta validan campos obligatorios y comunican errores o confirmaciones; las tarjetas actualizan su contenido inmediatamente después de guardar. La gestión de usuarios permite registrar perfiles y guarda la contraseña con PBKDF2, no en texto plano.

`localStorage` es modificable por el usuario y accesible desde JavaScript; por ello, esta autorización de frontend es solo para demostración y no protege información sensible. Para producción, mueve autenticación, permisos y persistencia a un servidor confiable; usa cookies `HttpOnly`, `Secure`, `SameSite`, TLS y controles de seguridad del servidor.

## Verificación

```powershell
npm test
npm run build
```
