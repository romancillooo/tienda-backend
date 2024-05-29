const db = require('../models'); // Asegúrate de que la ruta sea correcta
const Color = db.Color;

// Obtener todos los colores
exports.getAllColors = async (req, res) => {
  try {
    const colors = await Color.findAll();
    res.status(200).json(colors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un color por ID
exports.getColorById = async (req, res) => {
  try {
    const color = await Color.findByPk(req.params.id);
    if (color) {
      res.status(200).json(color);
    } else {
      res.status(404).json({ error: 'Color no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo color
exports.createColor = async (req, res) => {
  try {
    const { name, hex_code } = req.body;
    const newColor = await Color.create({ name, hex_code });
    res.status(201).json(newColor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un color
exports.updateColor = async (req, res) => {
  try {
    const { name, hex_code } = req.body;
    const color = await Color.findByPk(req.params.id);
    if (color) {
      await color.update({ name, hex_code });
      res.status(200).json(color);
    } else {
      res.status(404).json({ error: 'Color no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un color
exports.deleteColor = async (req, res) => {
  try {
    const color = await Color.findByPk(req.params.id);
    if (color) {
      await color.destroy();
      res.status(204).json();
    } else {
      res.status(404).json({ error: 'Color no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
