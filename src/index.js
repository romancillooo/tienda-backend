const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Importa la configuración de la base de datos

require('dotenv').config(); // Cargar variables de entorno

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middlewares
app.use(bodyParser.json());
app.use(cors());

// Middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
const productsRouter = require('./routes/products');
const brandsRouter = require('./routes/brands');
const categoriesRouter = require('./routes/categories');
const statisticsRouter = require('./routes/statistics');
const colorsRouter = require('./routes/colors');
const ordersRouter = require('./routes/orders');
const notificationsRouter = require('./routes/notifications');
const authRouter = require('./routes/auth');
const protectedRouter = require('./routes/protected'); // Importar las rutas protegidas

app.use('/api/products', productsRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/colors', colorsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/protected', protectedRouter); // Usar las rutas protegidas

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
