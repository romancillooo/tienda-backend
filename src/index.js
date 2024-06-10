const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

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
const paymentRoutes = require('./routes/payment'); // Importa las rutas de pago

// const colorsRouter = require('./routes/colors');
// const productColorsRouter = require('./routes/productColors');
// const productGalleryRouter = require('./routes/productGallery');

app.use('/api/products', productsRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/payment', paymentRoutes); // Usa las rutas de pago
// app.use('/api/colors', colorsRouter);
// app.use('/api/productColors', productColorsRouter);
// app.use('/api/productGallery', productGalleryRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
