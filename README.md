# control-gastos

## Descripción

Es una aplicación web enfocada en el manejo de las finanzas personales y el manejo de presupuesto. El proyecto ya está terminado y cuenta con los siguientes apartados: Resumen, Ingresos, Egresos y Metas de ahorro.

## ¿Qué hace cada apartado?

- **Resumen**: es la pantalla principal, muestra un resumen rápido de cómo van tus finanzas (ingresos, egresos, ahorro y deudas del mes).
- **Ingresos**: para registrar todo el dinero que te entra, clasificado en fijos, variables u otros ingresos.
- **Egresos**: para registrar tus gastos, clasificados en fijos o prioritarios, variables o deudas.
- **Metas de ahorro**: para ver cuánto dinero necesitas ahorrar para cumplir una meta.

## Tecnologías

- **Backend**: NodeJS, Typescript, Express.
- **Frontend**: Angular
- **Seguridad**: JWT
- **Base de datos**: PostgreSQL

## Requisitos previos

Verifica que los tengas instalados:

- Node.js (v18 o versiones superiores recomendado)
- pnpm
- PostgreSQL
- Angular CLI

## Instalación

1. Clona el siguiente repositorio:
   ```
   https://github.com/Jambrocio-2025444/control-gastos.git
   ```
2. Abre Visual Studio Code y abre la carpeta donde lo clonaste.
3. Crea un archivo `.env` dentro de la carpeta `backend`, guíate del archivo `.env.example` para ingresar tus datos. Tendrás que escribir lo siguiente dentro del archivo `.env`: `DB_PASSWORD=tuContraseña` y tu palabra clave en `JWT_SECRET`.
4. En una terminal, escribe lo siguiente para entrar al proyecto:
   ```
   cd control-gastos
   cd Control-Gastos
   ```
5. Escribe `cd backend` y luego `npm run dev`. Si todo salió bien, te aparecerá el siguiente mensaje: `Base de datos inicializada`.
6. En una nueva terminal, haz lo mismo del paso 4 y, cuando estés dentro del proyecto, escribe `cd frontend`. Estando dentro del frontend, escribe `ng serve`. Si todo salió bien, te redireccionará en tu navegador al login.
