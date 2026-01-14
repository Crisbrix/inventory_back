const { query } = require('../config/database');

// Obtener todas las alertas
const getAll = async (req, res) => {
  try {
    const sql = `
      SELECT a.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM alertas a
      JOIN productos p ON a.producto_id = p.id
      ORDER BY a.fecha DESC
    `;
    const alertas = await query(sql);
    
    res.json({
      success: true,
      data: alertas
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas'
    });
  }
};

// Obtener alertas activas
const getActivas = async (req, res) => {
  try {
    const sql = `
      SELECT a.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM alertas a
      JOIN productos p ON a.producto_id = p.id
      WHERE a.atendida = false
      ORDER BY a.fecha DESC
    `;
    const alertas = await query(sql);
    
    res.json({
      success: true,
      data: alertas
    });
  } catch (error) {
    console.error('Error obteniendo alertas activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas activas'
    });
  }
};

// Obtener alertas por producto
const getByProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM alertas
      WHERE producto_id = ?
      ORDER BY fecha DESC
    `;
    const alertas = await query(sql, [id]);
    
    res.json({
      success: true,
      data: alertas
    });
  } catch (error) {
    console.error('Error obteniendo alertas por producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas del producto'
    });
  }
};

// Marcar alerta como atendida
const marcarAtendida = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      UPDATE alertas 
      SET atendida = true 
      WHERE id = ?
    `;
    await query(sql, [id]);
    
    res.json({
      success: true,
      message: 'Alerta marcada como atendida'
    });
  } catch (error) {
    console.error('Error marcando alerta como atendida:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alerta como atendida'
    });
  }
};

// Crear nueva alerta
const create = async (req, res) => {
  try {
    const { producto_id, tipo, mensaje } = req.body;
    
    // Validar datos
    if (!producto_id || !tipo || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    const sql = `
      INSERT INTO alertas (producto_id, tipo, mensaje)
      VALUES (?, ?, ?)
    `;
    const result = await query(sql, [producto_id, tipo, mensaje]);
    
    res.json({
      success: true,
      message: 'Alerta creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear alerta'
    });
  }
};

// Eliminar alerta
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM alertas WHERE id = ?';
    await query(sql, [id]);
    
    res.json({
      success: true,
      message: 'Alerta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar alerta'
    });
  }
};

module.exports = {
  getAll,
  getActivas,
  getByProducto,
  marcarAtendida,
  create,
  delete: deleteAlert
};
