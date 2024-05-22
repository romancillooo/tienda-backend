const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middlewares
app.use(bodyParser.json());
app.use(cors());

// Rutas
const productsRouter = require('./routes/products');
const brandsRouter = require('./routes/brands');
const categoriesRouter = require('./routes/categories');
// const colorsRouter = require('./routes/colors');
// const productColorsRouter = require('./routes/productColors');
// const productGalleryRouter = require('./routes/productGallery');

app.use('/api/products', productsRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/categories', categoriesRouter);
// app.use('/api/colors', colorsRouter);
// app.use('/api/productColors', productColorsRouter);
// app.use('/api/productGallery', productGalleryRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
