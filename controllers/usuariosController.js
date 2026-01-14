const { pool } = require('../config/database');

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, correo, rol, activo, fecha_creacion
      FROM usuarios 
      ORDER BY fecha_creacion DESC
    `);
    
    res.json({
      success: true,
      data: rows,
      message: 'Usuarios obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT id, nombre, correo, rol, activo, fecha_creacion
      FROM usuarios 
      WHERE id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: 'Usuario obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Crear nuevo usuario
const createUser = async (req, res) => {
  try {
    const { nombre, correo, contrasena, rol = 'VENDEDOR' } = req.body;
    
    // Validaciones básicas
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      });
    }
    
    // Verificar si el correo ya existe
    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está en uso'
      });
    }
    
    // Hashear contraseña (simple por ahora, en producción usar bcrypt)
    const passwordHash = contrasena; // TODO: Implementar bcrypt
    
    // Insertar usuario
    const [result] = await pool.execute(`
      INSERT INTO usuarios (nombre, correo, contrasena, rol)
      VALUES (?, ?, ?, ?)
    `, [nombre, correo, passwordHash, rol]);
    
    // Obtener usuario creado
    const [newUser] = await pool.execute(`
      SELECT id, nombre, correo, rol, activo, fecha_creacion
      FROM usuarios 
      WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      data: newUser[0],
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, rol, activo } = req.body;
    
    // Verificar si usuario existe
    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar si correo ya existe (excluyendo el usuario actual)
    if (correo) {
      const [duplicateUser] = await pool.execute(
        'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
        [correo, id]
      );
      
      if (duplicateUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El correo ya está en uso'
        });
      }
    }
    
    // Actualizar usuario
    await pool.execute(`
      UPDATE usuarios 
      SET nombre = ?, correo = ?, rol = ?, activo = ?
      WHERE id = ?
    `, [nombre, correo, rol, activo, id]);
    
    // Obtener usuario actualizado
    const [updatedUser] = await pool.execute(`
      SELECT id, nombre, correo, rol, activo, fecha_creacion
      FROM usuarios 
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: updatedUser[0],
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Eliminar usuario (soft delete: desactivar)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si usuario existe
    const [existingUser] = await pool.execute(
      'SELECT id FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Desactivar usuario (soft delete)
    await pool.execute(
      'UPDATE usuarios SET activo = FALSE WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// Activar/Desactivar usuario
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener estado actual
    const [user] = await pool.execute(
      'SELECT activo FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Cambiar estado
    const newStatus = !user[0].activo;
    await pool.execute(
      'UPDATE usuarios SET activo = ? WHERE id = ?',
      [newStatus, id]
    );
    
    res.json({
      success: true,
      message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de usuario',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
};
