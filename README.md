# Inventory Backend - Node.js API

Backend API para sistema de inventario construido con Node.js, Express y MySQL.

## Requisitos

- Node.js 16+
- MySQL 8.0+
- Base de datos `inventary` creada

## Instalación

1. Instalar dependencias:
```bash
cd inventory_back
npm install
```

2. Configurar variables de entorno:
```bash
cp env.example .env
```

Editar `.env` con tus credenciales de MySQL:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=inventary
DB_PORT=3306
PORT=3000
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
```

3. Asegúrate de que la base de datos `inventary` existe y tiene la tabla `usuarios` con los campos necesarios.

## Ejecutar

### Desarrollo (con nodemon):
```bash
npm run dev
```

### Producción:
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
  - Body: `{ "email": "usuario@email.com", "password": "password" }`
- `GET /api/auth/verify` - Verificar token
  - Headers: `Authorization: Bearer <token>`

### Health Check
- `GET /api/health` - Verificar estado del servidor

## Estructura del Proyecto

```
inventory_back/
├── config/
│   └── database.js      # Configuración de MySQL
├── controllers/
│   └── authController.js
├── routes/
│   └── auth.js
├── env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Tecnologías

- Node.js
- Express.js
- MySQL2
- CORS
- dotenv
- bcryptjs
- jsonwebtoken
