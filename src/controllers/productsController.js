const pool = require('../db');
const fs = require('fs');
const path = require('path');

exports.getProducts = async (req, res) => {
  const query = `
    SELECT p.*, b.name as brand_name, c.name as category_name 
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    JOIN categories c ON p.category_id = c.id
  `;
  try {
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).send({ error: 'Error obteniendo productos' });
  }
};

exports.getProductsByBrand = async (req, res) => {
  const brandId = req.params.brandId;
  const query = 'SELECT * FROM products WHERE brand_id = ?';
  try {
    const [results] = await pool.query(query, [brandId]);
    if (results.length === 0) {
      res.status(404).send({ error: 'No products found for this brand' });
    } else {
      res.status(200).json(results);
    }
  } catch (err) {
    res.status(500).send({ error: 'Error fetching products' });
  }
};

exports.getLatestProducts = async (req, res) => {
  try {
    console.log("Ejecutando la consulta para obtener los productos más recientes...");
    const [results] = await pool.query('SELECT * FROM products ORDER BY createdAt DESC LIMIT 5');
    console.log("Resultados de la consulta:", results);
    if (results.length === 0) {
      console.log("No se encontraron productos."); // Añadir esta línea
      return res.status(404).send({ error: 'Producto no encontrado LatestProducts' });
    }
    res.status(200).json(results);
  } catch (error) {
    console.error("Error al obtener los productos más recientes:", error);
    res.status(500).json({ error: 'Error fetching latest products', details: error });
  }
};

exports.getProductById = async (req, res) => {
  const productId = req.params.id;
  const queryProduct = 'SELECT * FROM products WHERE id = ?';
  const queryColors = `
    SELECT pc.id as product_color_id, pc.color_id, pc.image, c.name as color_name, c.hex_code 
    FROM product_colors pc
    JOIN colors c ON pc.color_id = c.id
    WHERE pc.product_id = ?
  `;
  const queryGallery = `
    SELECT pcg.image, pcg.product_color_id 
    FROM product_color_gallery pcg
    JOIN product_colors pc ON pcg.product_color_id = pc.id
    WHERE pc.product_id = ?
  `;

  try {
    const [productResults] = await pool.query(queryProduct, [productId]);
    if (productResults.length === 0) {
      console.log("No se encontró el producto con el ID:", productId); // Añadir esta línea
      return res.status(404).send({ error: 'Producto no encontrado productId' });
    }
    const product = productResults[0];
    try {
      product.available_sizes = JSON.parse(product.available_sizes);
    } catch (error) {
      product.available_sizes = [];
    }

    const [colorsResults] = await pool.query(queryColors, [productId]);
    product.colors = colorsResults;

    const [galleryResults] = await pool.query(queryGallery, [productId]);
    const galleryImages = {};
    galleryResults.forEach(gallery => {
      if (!galleryImages[gallery.product_color_id]) {
        galleryImages[gallery.product_color_id] = [];
      }
      galleryImages[gallery.product_color_id].push(gallery.image);
    });
    product.colors.forEach(color => {
      color.galleryImages = galleryImages[color.product_color_id] || [];
    });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).send({ error: 'Error obteniendo el producto', details: error });
  }
};

exports.createProduct = async (req, res) => {
  const { brand_id, category_id, name, price, available_sizes } = req.body;
  const image = req.files.find(file => file.fieldname === 'image');
  const image2 = req.files.find(file => file.fieldname === 'image2');

  if (!image || !image2) {
    return res.status(400).send({ error: 'Ambas imágenes principales del producto son requeridas' });
  }

  const colorsData = JSON.parse(req.body.colors);

  let sizesArray = [];
  try {
    sizesArray = JSON.parse(available_sizes);
  } catch (e) {
    sizesArray = available_sizes.split(',').map(size => size.trim());
  }

  const query = 'INSERT INTO products (brand_id, category_id, name, price, image, image2, available_sizes) VALUES (?, ?, ?, ?, ?, ?, ?)';
  try {
    const [results] = await pool.query(query, [brand_id, category_id, name, price, image.filename, image2.filename, JSON.stringify(sizesArray)]);
    const productId = results.insertId;

    const colorQueries = colorsData.map(color => {
      const colorImages = req.files.filter(file => file.fieldname.startsWith(`galleryImages_${color.id}`));
      const query = 'INSERT INTO product_colors (product_id, color_id, image) VALUES (?, ?, ?)';
      return new Promise((resolve, reject) => {
        const colorImage = colorImages.length > 0 ? colorImages[0].filename : null;
        pool.query(query, [productId, color.id, colorImage])
          .then(([colorResults]) => {
            const productColorId = colorResults.insertId;
            const galleryImages = colorImages.map(file => file.filename);
            const galleryQuery = 'INSERT INTO product_color_gallery (product_color_id, image) VALUES ?';
            const galleryValues = galleryImages.map(img => [productColorId, img]);
            if (galleryValues.length > 0) {
              pool.query(galleryQuery, [galleryValues])
                .then(() => resolve())
                .catch(err => reject(err));
            } else {
              resolve();
            }
          })
          .catch(err => reject(err));
      });
    });

    await Promise.all(colorQueries);
    res.status(201).json({ id: productId, brand_id, category_id, name, price, image: image.filename, image2: image2.filename, available_sizes: sizesArray });
  } catch (error) {
    console.error('Error creando el producto:', error);
    res.status(500).send({ error: 'Error creando el producto', details: error });
  }
};

exports.updateProduct = async (req, res) => {
  const productId = req.params.id;
  const { brand_id, category_id, name, price, available_sizes } = req.body;
  const image = req.files.find(file => file.fieldname === 'image') || req.body.image;
  const image2 = req.files.find(file => file.fieldname === 'image2') || req.body.image2;
  const newGalleryImages = req.files.filter(file => file.fieldname.startsWith('galleryImages_')).map(file => file.filename);
  const deletedGalleryImages = JSON.parse(req.body.deletedGalleryImages || '[]');

  let colorsData = [];
  if (Array.isArray(req.body.colors)) {
    colorsData = req.body.colors;
  } else {
    try {
      colorsData = JSON.parse(req.body.colors);
    } catch (error) {
      return res.status(400).send({ error: 'Invalid colors data format' });
    }
  }

  let sizesArray = [];
  try {
    sizesArray = JSON.parse(available_sizes);
  } catch (e) {
    sizesArray = available_sizes.split(',').map(size => size.trim());
  }

  const query = 'UPDATE products SET brand_id = ?, category_id = ?, name = ?, price = ?, image = ?, image2 = ?, available_sizes = ? WHERE id = ?';
  try {
    const [results] = await pool.query(query, [brand_id, category_id, name, price, typeof image === 'string' ? image : image.filename, typeof image2 === 'string' ? image2 : image2.filename, JSON.stringify(sizesArray), productId]);
    if (results.affectedRows === 0) {
      return res.status(404).send({ error: 'Producto no encontrado' });
    }

    if (deletedGalleryImages.length > 0) {
      const deleteGalleryQuery = 'DELETE FROM product_color_gallery WHERE image IN (?)';
      await pool.query(deleteGalleryQuery, [deletedGalleryImages]);
    }

    const colorQueries = colorsData.map(color => {
      return new Promise((resolve, reject) => {
        if (color.product_color_id) {
          const updateColorQuery = 'UPDATE product_colors SET color_id = ?, image = ? WHERE id = ?';
          pool.query(updateColorQuery, [color.id, color.image, color.product_color_id])
            .then(() => resolve(color.product_color_id))
            .catch(err => reject(err));
        } else {
          const insertColorQuery = 'INSERT INTO product_colors (product_id, color_id, image) VALUES (?, ?, ?)';
          pool.query(insertColorQuery, [productId, color.id, color.image])
            .then(([insertResults]) => resolve(insertResults.insertId))
            .catch(err => reject(err));
        }
      });
    });

    const colorIds = await Promise.all(colorQueries);

    const galleryQueries = colorIds.map((productColorId, index) => {
      const color = colorsData[index];
      const colorImages = req.files.filter(file => file.fieldname.startsWith(`galleryImages_${color.id}`));
      const galleryImages = colorImages.map(file => file.filename);
      const galleryQuery = 'INSERT INTO product_color_gallery (product_color_id, image) VALUES ?';
      const galleryValues = galleryImages.map(img => [productColorId, img]);
      if (galleryValues.length > 0) {
        return new Promise((resolve, reject) => {
          pool.query(galleryQuery, [galleryValues])
            .then(() => resolve())
            .catch(err => reject(err));
        });
      } else {
        return Promise.resolve();
      }
    });

    await Promise.all(galleryQueries);
    res.status(200).json({ id: productId, brand_id, category_id, name, price, image: typeof image === 'string' ? image : image.filename, image2: typeof image2 === 'string' ? image2 : image2.filename, available_sizes: sizesArray });
  } catch (error) {
    res.status(500).send({ error: 'Error actualizando la galería del producto', details: error });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;

  const queryGetProduct = 'SELECT image, image2 FROM products WHERE id = ?';
  try {
    const [results] = await pool.query(queryGetProduct, [productId]);
    if (results.length === 0) {
      return res.status(404).send({ error: 'Producto no encontrado' });
    }
    const product = results[0];

    if (product.image) {
      const imagePath = path.join(__dirname, '../../uploads/products-images', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error eliminando la imagen del producto:', err);
        });
      }
    }

    if (product.image2) {
      const imagePath2 = path.join(__dirname, '../../uploads/products-images', product.image2);
      if (fs.existsSync(imagePath2)) {
        fs.unlink(imagePath2, (err) => {
          if (err) console.error('Error eliminando la segunda imagen del producto:', err);
        });
      }
    }

    const queryGetGallery = 'SELECT image FROM product_color_gallery WHERE product_color_id IN (SELECT id FROM product_colors WHERE product_id = ?)';
    const [galleryResults] = await pool.query(queryGetGallery, [productId]);
    const galleryImages = galleryResults.map(g => g.image);

    galleryImages.forEach(image => {
      const galleryImagePath = path.join(__dirname, '../../uploads/product-gallery-images', image);
      if (fs.existsSync(galleryImagePath)) {
        fs.unlink(galleryImagePath, (err) => {
          if (err) console.error('Error eliminando la imagen de la galería:', err);
        });
      }
    });

    const queryDeleteGallery = 'DELETE FROM product_color_gallery WHERE product_color_id IN (SELECT id FROM product_colors WHERE product_id = ?)';
    await pool.query(queryDeleteGallery, [productId]);

    const queryDeleteProductColors = 'DELETE FROM product_colors WHERE product_id = ?';
    await pool.query(queryDeleteProductColors, [productId]);

    const queryDeleteProduct = 'DELETE FROM products WHERE id = ?';
    const [deleteProductResults] = await pool.query(queryDeleteProduct, [productId]);

    if (deleteProductResults.affectedRows === 0) {
      return res.status(404).send({ error: 'Producto no encontrado' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).send({ error: 'Error eliminando el producto', details: err });
  }
};
