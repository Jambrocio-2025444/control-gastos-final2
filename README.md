# control-gastos

## Descripción

Es una aplicación web enfocada en el manejo de las finanzas personales y el manejo de presupuesto. El proyecto ya está terminado y cuenta con los siguientes apartados: Resumen, Ingresos, Egresos y Metas de ahorro.

## ¿Qué hace cada apartado?

- **Resumen**: Es la pantalla principal, muestra un resumen rápido de cómo van tus finanzas (ingresos, egresos, ahorro y deudas del mes).
- **Ingresos**: Para registrar todo el dinero que te entra, clasificado en fijos, variables u otros ingresos.
- **Egresos**: Para registrar tus gastos, clasificados en fijos o prioritarios, variables o deudas.
- **Metas de ahorro**: Para ver cuánto dinero necesitas ahorrar para cumplir una meta.

## Tecnologías

- **Backend**: NodeJS, Typescript, Express.
- **Frontend**: Angular
- **Seguridad**: JWT & Google Auth
- **Base de datos**: PostgreSQL

## Requisitos previos

Verifica que los tengas instalados:

- Node.js (v18 o versiones superiores recomendado)
- pnpm
- PostgreSQL
- Angular CLI

## Instalación

1. Clona el siguiente repositorio:
   ```bash
  https://github.com](https://github.com/Jambrocio-2025444/control-gastos-final2.git
   ```

2. Abre Visual Studio Code y abre la carpeta del proyecto que acabas de clonar (`control-gastos`).

3. **Configuración del Backend:**
   Abre una terminal en VS Code y ejecuta los siguientes comandos para entrar a la carpeta del servidor e instalar las dependencias base:
   ```bash
   cd backend
   pnpm install
   ```

4. **Instalación de la API de Google:**
   En la misma terminal del backend, asegúrate de instalar la biblioteca oficial de autenticación de Google ejecuntando:
   ```bash
   pnpm add google-auth-library
   ```

5. Crea un archivo llamado `.env` dentro de la carpeta `backend`. Puedes guiarte del archivo `.env.example` para ingresar tus credenciales. El archivo debe contener obligatoriamente:
   ```env
   DB_PASSWORD=tuContraseñaDePostgres
   JWT_SECRET=tuPalabraClaveSecreta
   GOOGLE_CLIENT_ID=elCodigoQueTeDaGoogleCloud
   ```

6. Inicia el servidor de desarrollo del backend con el siguiente comando:
   ```bash
   pnpm run dev
   ```
   *Si todo salió bien, verás el mensaje:* `Base de datos inicializada`.

7. **Configuración del Frontend:**
   Abre una **nueva terminal** en VS Code (dejando la del backend corriendo) y ejecuta lo siguiente para instalar las dependencias del cliente y levantar la interfaz de Angular:
   ```bash
   cd frontend
   pnpm install
   ng serve
   ```
   *Si todo compila correctamente, el sistema te redireccionará en tu navegador automáticamente al Login.*
