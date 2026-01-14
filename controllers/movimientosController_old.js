const { pool } = require('../config/database');

// Obtener todos los movimientos
const getAll = async (req, res) => {
  try {
    const [movimientos] = await pool.execute(`
      SELECT m.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM movimientos_inventario m
      JOIN productos p ON m.producto_id = p.id
      ORDER BY m.fecha DESC
    `);
    
    res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos'
    });
  }
};

// Obtener movimientos de hoy
const getHoy = async (req, res) => {
  try {
    const [movimientos] = await pool.execute(`
      SELECT m.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM movimientos_inventario m
      JOIN productos p ON m.producto_id = p.id
      WHERE DATE(m.fecha) = CURDATE()
      ORDER BY m.fecha DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error obteniendo movimientos de hoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos de hoy'
    });
  }
};

// Obtener movimientos por tipo
const getByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const sql = `
      SELECT m.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM movimientos_inventario m
      JOIN productos p ON m.producto_id = p.id
      WHERE m.tipo_movimiento = ?
      ORDER BY m.fecha DESC
    `;
    const movimientos = await query(sql, [tipo]);
    
    res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error obteniendo movimientos por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos por tipo'
    });
  }
};

// Obtener top 5 productos más movidos
const getTopProductos = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id,
        p.nombre,
        p.codigo,
        COUNT(m.id) as total_movimientos,
        SUM(CASE WHEN m.tipo_movimiento = 'ENTRADA' THEN m.cantidad ELSE 0 END) as total_entradas,
        SUM(CASE WHEN m.tipo_movimiento = 'SALIDA' THEN m.cantidad ELSE 0 END) as total_salidas
      FROM productos p
      LEFT JOIN movimientos_inventario m ON p.id = m.producto_id
      GROUP BY p.id, p.nombre, p.codigo
      HAVING total_movimientos > 0
      ORDER BY total_movimientos DESC
      LIMIT 5
    `;
    const productos = await query(sql);
    
    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error obteniendo top productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener top productos'
    });
  }
};

// Obtener estadísticas de entradas vs salidas
const getEntradasSalidas = async (req, res) => {
  try {
    const sql = `
      SELECT 
        tipo_movimiento,
        COUNT(*) as total_movimientos,
        SUM(cantidad) as total_cantidad
      FROM movimientos_inventario
      WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY tipo_movimiento
    `;
    const estadisticas = await query(sql);
    
    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas entradas-salidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Obtener movimientos por tipo para gráfica
const getMovimientosPorTipo = async (req, res) => {
  try {
    const sql = `
      SELECT 
        tipo_movimiento,
        COUNT(*) as cantidad
      FROM movimientos_inventario
      WHERE DATE(fecha) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY tipo_movimiento
    `;
    const movimientos = await query(sql);
    
    res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error obteniendo movimientos por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos por tipo'
    });
  }
};

// Crear nuevo movimiento
const create = async (req, res) => {
  try {
    const { producto_id, tipo_movimiento, cantidad, observacion } = req.body;
    
    // Validar datos
    if (!producto_id || !tipo_movimiento || !cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    // Insertar movimiento
    const sql = `
      INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad, observacion)
      VALUES (?, ?, ?, ?)
    `;
    const result = await query(sql, [producto_id, tipo_movimiento, cantidad, observacion]);
    
    // Actualizar stock del producto
    const updateSql = `
      UPDATE productos 
      SET stock = stock ${tipo_movimiento === 'ENTRADA' ? '+' : '-'} ?
      WHERE id = ?
    `;
    await query(updateSql, [cantidad, producto_id]);
    
    res.json({
      success: true,
      message: 'Movimiento creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear movimiento'
    });
  }
};

// Obtener movimientos por producto
const getByProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM movimientos_inventario
      WHERE producto_id = ?
      ORDER BY fecha DESC
    `;
    const movimientos = await query(sql, [id]);
    
    res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error obteniendo movimientos por producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos del producto'
    });
  }
};

module.exports = {
  getAll,
  getHoy,
  getByTipo,
  getTopProductos,
  getEntradasSalidas,
  getMovimientosPorTipo,
  create,
  getByProducto
};
