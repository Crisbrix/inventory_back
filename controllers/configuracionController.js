const { pool } = require('../config/database');

// Obtener toda la configuración del sistema
const getAllConfig = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT clave, valor, descripcion, fecha_actualizacion
      FROM configuracion_sistema 
      ORDER BY clave
    `);
    
    // Convertir a objeto clave-valor
    const config = {};
    rows.forEach(row => {
      config[row.clave] = {
        valor: row.valor,
        descripcion: row.descripcion,
        fecha_actualizacion: row.fecha_actualizacion
      };
    });
    
    res.json({
      success: true,
      data: config,
      message: 'Configuración obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: error.message
    });
  }
};

// Obtener configuración por clave
const getConfigByKey = async (req, res) => {
  try {
    const { clave } = req.params;
    const [rows] = await pool.execute(`
      SELECT clave, valor, descripcion, fecha_actualizacion
      FROM configuracion_sistema 
      WHERE clave = ?
    `, [clave]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: 'Configuración obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: error.message
    });
  }
};

// Actualizar configuración
const updateConfig = async (req, res) => {
  try {
    const configuraciones = req.body; // Objeto con clave-valor
    
    if (!configuraciones || typeof configuraciones !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Se debe proporcionar un objeto con las configuraciones'
      });
    }
    
    const actualizaciones = [];
    
    // Actualizar cada configuración
    for (const [clave, valor] of Object.entries(configuraciones)) {
      try {
        await pool.execute(`
          UPDATE configuracion_sistema 
          SET valor = ? 
          WHERE clave = ?
        `, [typeof valor === 'object' ? JSON.stringify(valor) : valor, clave]);
        
        actualizaciones.push(clave);
      } catch (error) {
        console.error(`Error al actualizar configuración ${clave}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: `Configuraciones actualizadas: ${actualizaciones.join(', ')}`,
      data: actualizaciones
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración',
      error: error.message
    });
  }
};

// Actualizar configuración individual
const updateSingleConfig = async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor, descripcion } = req.body;
    
    if (valor === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El valor es requerido'
      });
    }
    
    // Verificar si la configuración existe
    const [existing] = await pool.execute(
      'SELECT id FROM configuracion_sistema WHERE clave = ?',
      [clave]
    );
    
    if (existing.length === 0) {
      // Crear nueva configuración si no existe
      await pool.execute(`
        INSERT INTO configuracion_sistema (clave, valor, descripcion)
        VALUES (?, ?, ?)
      `, [clave, typeof valor === 'object' ? JSON.stringify(valor) : valor, descripcion || '']);
    } else {
      // Actualizar configuración existente
      const updateFields = ['valor = ?'];
      const updateValues = [typeof valor === 'object' ? JSON.stringify(valor) : valor];
      
      if (descripcion !== undefined) {
        updateFields.push('descripcion = ?');
        updateValues.push(descripcion);
      }
      
      updateValues.push(clave);
      
      await pool.execute(`
        UPDATE configuracion_sistema 
        SET ${updateFields.join(', ')}
        WHERE clave = ?
      `, updateValues);
    }
    
    // Obtener configuración actualizada
    const [updated] = await pool.execute(`
      SELECT clave, valor, descripcion, fecha_actualizacion
      FROM configuracion_sistema 
      WHERE clave = ?
    `, [clave]);
    
    res.json({
      success: true,
      data: updated[0],
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración',
      error: error.message
    });
  }
};

// Resetear configuración a valores por defecto
const resetConfig = async (req, res) => {
  try {
    // Valores por defecto
    const defaultConfig = {
      'nombre_empresa': 'Inventory System',
      'logo_url': '',
      'tema': 'light',
      'idioma': 'es',
      'formato_fecha': 'DD/MM/YYYY',
      'email_alertas': 'true',
      'email_reportes': 'true',
      'email_bajo_stock': 'true',
      'notificaciones_push': 'false',
      'frecuencia_reportes': 'semanal'
    };
    
    const actualizaciones = [];
    
    for (const [clave, valor] of Object.entries(defaultConfig)) {
      try {
        await pool.execute(`
          UPDATE configuracion_sistema 
          SET valor = ? 
          WHERE clave = ?
        `, [valor, clave]);
        actualizaciones.push(clave);
      } catch (error) {
        console.error(`Error al resetear configuración ${clave}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: 'Configuración reseteada a valores por defecto',
      data: actualizaciones
    });
  } catch (error) {
    console.error('Error al resetear configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear configuración',
      error: error.message
    });
  }
};

module.exports = {
  getAllConfig,
  getConfigByKey,
  updateConfig,
  updateSingleConfig,
  resetConfig
};
