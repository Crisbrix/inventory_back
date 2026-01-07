const { query } = require('../config/database');
const connection = require('../config/database').pool;

// Obtener todas las ventas
const getAll = async (req, res) => {
  try {
    const sql = `
      SELECT v.*, u.nombre as usuario_nombre, u.correo as usuario_email,
             COUNT(vd.id) as total_productos
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
      GROUP BY v.id, u.nombre, u.correo
      ORDER BY v.fecha DESC
    `;
    const ventas = await query(sql);
    
    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas'
    });
  }
};

// Obtener KPIs para el dashboard
const getKPIs = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Ventas del día
    const ventasDiaSql = `
      SELECT COALESCE(SUM(total), 0) as total_dia, COUNT(*) as cantidad_ventas_dia
      FROM ventas 
      WHERE fecha >= ?
    `;
    const ventasDia = await query(ventasDiaSql, [inicioDia]);
    
    // Ventas del mes
    const ventasMesSql = `
      SELECT COALESCE(SUM(total), 0) as total_mes, COUNT(*) as cantidad_ventas_mes
      FROM ventas 
      WHERE fecha >= ?
    `;
    const ventasMes = await query(ventasMesSql, [inicioMes]);
    
    // Producto más vendido
    const topProductoSql = `
      SELECT p.nombre, SUM(vd.cantidad) as total_vendido, SUM(vd.cantidad * vd.precio) as total_venta
      FROM venta_detalle vd
      JOIN ventas v ON vd.venta_id = v.id
      JOIN productos p ON vd.producto_id = p.id
      GROUP BY p.id, p.nombre
      ORDER BY total_vendido DESC
      LIMIT 1
    `;
    const topProducto = await query(topProductoSql);
    
    // Ventas por método de pago
    const ventasMetodoSql = `
      SELECT metodo_pago, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
      FROM ventas
      GROUP BY metodo_pago
    `;
    const ventasMetodo = await query(ventasMetodoSql);
    
    res.json({
      success: true,
      data: {
        ventasDia: ventasDia[0],
        ventasMes: ventasMes[0],
        topProducto: topProducto[0],
        ventasMetodo: ventasMetodo
      }
    });
  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener KPIs'
    });
  }
};

// Obtener ventas por período para reportes
const getVentasPorPeriodo = async (req, res) => {
  try {
    const { periodo, anio, mes } = req.query;
    let sql = '';
    let params = [];
    
    if (periodo === 'dia') {
      sql = `
        SELECT DATE(fecha) as fecha, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
        FROM ventas
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
      `;
    } else if (periodo === 'mes') {
      sql = `
        SELECT DATE(fecha) as fecha, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
        FROM ventas
        WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
      `;
      params = [anio || new Date().getFullYear(), mes || new Date().getMonth() + 1];
    } else if (periodo === 'anio') {
      sql = `
        SELECT MONTH(fecha) as mes, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
        FROM ventas
        WHERE YEAR(fecha) = ?
        GROUP BY MONTH(fecha)
        ORDER BY mes
      `;
      params = [anio || new Date().getFullYear()];
    } else {
      // Por defecto: últimos 30 días
      sql = `
        SELECT DATE(fecha) as fecha, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
        FROM ventas
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha DESC
      `;
    }
    
    const ventas = await query(sql, params);
    
    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error obteniendo ventas por período:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por período'
    });
  }
};

// Obtener venta por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener venta principal
    const ventaSql = `
      SELECT v.*, u.nombre as usuario_nombre, u.correo as usuario_email
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = ?
    `;
    const venta = await query(ventaSql, [id]);
    
    if (venta.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }
    
    // Obtener detalles de la venta
    const detallesSql = `
      SELECT vd.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM venta_detalle vd
      JOIN productos p ON vd.producto_id = p.id
      WHERE vd.venta_id = ?
    `;
    const detalles = await query(detallesSql, [id]);
    
    res.json({
      success: true,
      data: {
        ...venta[0],
        detalles
      }
    });
  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta'
    });
  }
};

// Crear nueva venta
const create = async (req, res) => {
  const conn = await connection.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const { 
      usuario_id, 
      detalles, 
      metodo_pago, 
      monto_recibido,
      descuento = 0 
    } = req.body;
    
    // Validar datos
    if (!usuario_id || !detalles || detalles.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }
    
    // Calcular total
    let subtotal = 0;
    for (const detalle of detalles) {
      subtotal += detalle.cantidad * detalle.precio;
    }
    
    const total = subtotal - descuento;
    
    // Insertar venta
    const ventaSql = `
      INSERT INTO ventas (usuario_id, total, metodo_pago, monto_recibido, descuento)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [ventaResult] = await conn.execute(ventaSql, [
      usuario_id, 
      total, 
      metodo_pago, 
      monto_recibido || total,
      descuento
    ]);
    
    const ventaId = ventaResult.insertId;
    
    // Insertar detalles y actualizar stock
    for (const detalle of detalles) {
      // Insertar detalle de venta
      const detalleSql = `
        INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio)
        VALUES (?, ?, ?, ?)
      `;
      await conn.execute(detalleSql, [
        ventaId, 
        detalle.producto_id, 
        detalle.cantidad, 
        detalle.precio
      ]);
      
      // Actualizar stock del producto
      const updateStockSql = `
        UPDATE productos 
        SET stock_actual = stock_actual - ?
        WHERE id = ? AND stock_actual >= ?
      `;
      const [updateResult] = await conn.execute(updateStockSql, [
        detalle.cantidad, 
        detalle.producto_id, 
        detalle.cantidad
      ]);
      
      if (updateResult.affectedRows === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para el producto ${detalle.producto_id}`
        });
      }
      
      // Crear movimiento de inventario
      const movimientoSql = `
        INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad, observacion)
        VALUES (?, 'SALIDA', ?, ?)
      `;
      await conn.execute(movimientoSql, [
        detalle.producto_id, 
        detalle.cantidad, 
        `Venta #${ventaId}`
      ]);
    }
    
    await conn.commit();
    
    // Calcular cambio
    const cambio = (monto_recibido || total) - total;
    
    await conn.release();
    
    res.json({
      success: true,
      message: 'Venta creada exitosamente',
      data: {
        id: ventaId,
        total,
        subtotal,
        descuento,
        monto_recibido: monto_recibido || total,
        cambio,
        metodo_pago
      }
    });
    
  } catch (error) {
    await conn.rollback();
    await conn.release();
    console.error('Error creando venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear venta'
    });
  } finally {
    // La conexión se libera en el try y catch
  }
};

// Obtener ventas por fecha
const getByFecha = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let sql = `
      SELECT v.*, u.nombre as usuario_nombre
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
    `;
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
      sql += ` WHERE v.fecha BETWEEN ? AND ?`;
      params.push(fecha_inicio, fecha_fin);
    }
    
    sql += ` ORDER BY v.fecha DESC`;
    
    const ventas = await query(sql, params);
    
    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error obteniendo ventas por fecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por fecha'
    });
  }
};

// Obtener rotación de inventario para reportes
const getRotacionInventario = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.nombre as producto,
        p.codigo,
        p.stock_actual,
        COALESCE(SUM(vd.cantidad), 0) as total_vendido,
        CASE 
          WHEN p.stock_actual = 0 THEN 0
          ELSE ROUND(COALESCE(SUM(vd.cantidad), 0) / NULLIF(p.stock_actual, 0), 2)
        END as rotacion
      FROM productos p
      LEFT JOIN venta_detalle vd ON p.id = vd.producto_id
      LEFT JOIN ventas v ON vd.venta_id = v.id 
        AND v.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY p.id, p.nombre, p.codigo, p.stock_actual
      ORDER BY rotacion DESC
      LIMIT 20
    `;
    const rotacion = await query(sql);
    
    res.json({
      success: true,
      data: rotacion
    });
  } catch (error) {
    console.error('Error obteniendo rotación de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rotación de inventario'
    });
  }
};

// Obtener ventas por categoría para reportes
const getVentasPorCategoria = async (req, res) => {
  try {
    // Como no existe tabla de categorías, agrupamos por tipo de producto basado en el nombre
    const sql = `
      SELECT 
        CASE 
          WHEN LOWER(p.nombre) LIKE '%camisa%' THEN 'Camisas'
          WHEN LOWER(p.nombre) LIKE '%pantalon%' THEN 'Pantalones'
          WHEN LOWER(p.nombre) LIKE '%vestido%' THEN 'Vestidos'
          WHEN LOWER(p.nombre) LIKE '%accesorio%' THEN 'Accesorios'
          WHEN LOWER(p.nombre) LIKE '%zapato%' OR LOWER(p.nombre) LIKE '%tenis%' THEN 'Calzado'
          ELSE 'Otros'
        END as categoria,
        COUNT(DISTINCT v.id) as cantidad_ventas,
        COALESCE(SUM(v.total), 0) as total,
        COALESCE(SUM(vd.cantidad), 0) as total_unidades
      FROM productos p
      LEFT JOIN venta_detalle vd ON p.id = vd.producto_id
      LEFT JOIN ventas v ON vd.venta_id = v.id
      GROUP BY categoria
      ORDER BY total DESC
    `;
    const ventasCategoria = await query(sql);
    
    res.json({
      success: true,
      data: ventasCategoria
    });
  } catch (error) {
    console.error('Error obteniendo ventas por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por categoría'
    });
  }
};

// Obtener top productos más vendidos
const getTopProductos = async (req, res) => {
  try {
    const { limite = 10 } = req.query;
    
    const sql = `
      SELECT 
        p.id,
        p.nombre,
        p.codigo,
        p.precio,
        COALESCE(SUM(vd.cantidad), 0) as unidades_vendidas,
        COALESCE(SUM(vd.cantidad * vd.precio), 0) as total_venta,
        COUNT(DISTINCT vd.venta_id) as cantidad_ventas
      FROM productos p
      LEFT JOIN venta_detalle vd ON p.id = vd.producto_id
      LEFT JOIN ventas v ON vd.venta_id = v.id
      GROUP BY p.id, p.nombre, p.codigo, p.precio
      HAVING unidades_vendidas > 0
      ORDER BY unidades_vendidas DESC
      LIMIT ?
    `;
    const topProductos = await query(sql, [parseInt(limite)]);
    
    res.json({
      success: true,
      data: topProductos
    });
  } catch (error) {
    console.error('Error obteniendo top productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener top productos'
    });
  }
};

// Obtener ventas por método de pago (extendido)
const getVentasPorMetodoPago = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;
    
    let sql = '';
    let params = [];
    
    if (periodo === 'dia') {
      sql = `
        SELECT 
          metodo_pago,
          COUNT(*) as cantidad,
          COALESCE(SUM(total), 0) as total,
          DATE(fecha) as fecha
        FROM ventas
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY metodo_pago, DATE(fecha)
        ORDER BY fecha DESC, total DESC
      `;
    } else if (periodo === 'mes') {
      sql = `
        SELECT 
          metodo_pago,
          COUNT(*) as cantidad,
          COALESCE(SUM(total), 0) as total
        FROM ventas
        WHERE MONTH(fecha) = MONTH(CURDATE()) 
          AND YEAR(fecha) = YEAR(CURDATE())
        GROUP BY metodo_pago
        ORDER BY total DESC
      `;
    } else {
      sql = `
        SELECT 
          metodo_pago,
          COUNT(*) as cantidad,
          COALESCE(SUM(total), 0) as total
        FROM ventas
        GROUP BY metodo_pago
        ORDER BY total DESC
      `;
    }
    
    const ventasMetodo = await query(sql, params);
    
    res.json({
      success: true,
      data: ventasMetodo
    });
  } catch (error) {
    console.error('Error obteniendo ventas por método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por método de pago'
    });
  }
};

// Obtener tendencia de ventas para gráfico de líneas
const getTendenciaVentas = async (req, res) => {
  try {
    const { periodo = 'semana', anio, mes } = req.query;
    let sql = '';
    let params = [];
    
    if (periodo === 'dia') {
      sql = `
        SELECT 
          DATE(fecha) as fecha,
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as cantidad_ventas
        FROM ventas
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha ASC
      `;
    } else if (periodo === 'semana') {
      sql = `
        SELECT 
          DATE(fecha) as fecha,
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as cantidad_ventas
        FROM ventas
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(fecha)
        ORDER BY fecha ASC
      `;
    } else if (periodo === 'mes') {
      sql = `
        SELECT 
          DATE(fecha) as fecha,
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as cantidad_ventas
        FROM ventas
        WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
        GROUP BY DATE(fecha)
        ORDER BY fecha ASC
      `;
      params = [anio || new Date().getFullYear(), mes || new Date().getMonth() + 1];
    } else if (periodo === 'anio') {
      sql = `
        SELECT 
          MONTH(fecha) as mes,
          CASE MONTH(fecha)
            WHEN 1 THEN 'Enero'
            WHEN 2 THEN 'Febrero'
            WHEN 3 THEN 'Marzo'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Mayo'
            WHEN 6 THEN 'Junio'
            WHEN 7 THEN 'Julio'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Septiembre'
            WHEN 10 THEN 'Octubre'
            WHEN 11 THEN 'Noviembre'
            WHEN 12 THEN 'Diciembre'
          END as nombre_mes,
          COALESCE(SUM(total), 0) as total,
          COUNT(*) as cantidad_ventas
        FROM ventas
        WHERE YEAR(fecha) = ?
        GROUP BY MONTH(fecha)
        ORDER BY mes ASC
      `;
      params = [anio || new Date().getFullYear()];
    }
    
    const tendencia = await query(sql, params);
    
    res.json({
      success: true,
      data: tendencia
    });
  } catch (error) {
    console.error('Error obteniendo tendencia de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tendencia de ventas'
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  getByFecha,
  getKPIs,
  getVentasPorPeriodo,
  getRotacionInventario,
  getVentasPorCategoria,
  getTopProductos,
  getVentasPorMetodoPago,
  getTendenciaVentas
};
