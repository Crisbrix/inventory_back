const { testConnection } = require('../config/database');

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
  try {
    const db = await testConnection();
    const [rows] = await db.execute(`
      SELECT id, username, nombre, email, perfil, telefono, direccion, 
             activo, fecha_creacion, fecha_actualizacion, ultimo_login
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
    const db = await testConnection();
    const [rows] = await db.execute(`
      SELECT id, username, nombre, email, perfil, telefono, direccion, 
             activo, fecha_creacion, fecha_actualizacion, ultimo_login
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
    const { username, nombre, email, password, perfil = 'USER', telefono, direccion } = req.body;
    
    // Validaciones básicas
    if (!username || !nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      });
    }
    
    const db = await testConnection();
    
    // Verificar si el username o email ya existen
    const [existingUser] = await db.execute(
      'SELECT id FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El username o email ya están en uso'
      });
    }
    
    // Hashear contraseña (simple por ahora, en producción usar bcrypt)
    const passwordHash = password; // TODO: Implementar bcrypt
    
    // Insertar usuario
    const [result] = await db.execute(`
      INSERT INTO usuarios (username, nombre, email, password_hash, perfil, telefono, direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [username, nombre, email, passwordHash, perfil, telefono, direccion]);
    
    // Obtener usuario creado
    const [newUser] = await db.execute(`
      SELECT id, username, nombre, email, perfil, telefono, direccion, 
             activo, fecha_creacion, fecha_actualizacion
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
    const { username, nombre, email, perfil, telefono, direccion } = req.body;
    
    const db = await testConnection();
    
    // Verificar si usuario existe
    const [existingUser] = await db.execute(
      'SELECT id FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar si username o email ya existen (excluyendo el usuario actual)
    const [duplicateUser] = await db.execute(
      'SELECT id FROM usuarios WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );
    
    if (duplicateUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El username o email ya están en uso'
      });
    }
    
    // Actualizar usuario
    await db.execute(`
      UPDATE usuarios 
      SET username = ?, nombre = ?, email = ?, perfil = ?, telefono = ?, direccion = ?
      WHERE id = ?
    `, [username, nombre, email, perfil, telefono, direccion, id]);
    
    // Obtener usuario actualizado
    const [updatedUser] = await db.execute(`
      SELECT id, username, nombre, email, perfil, telefono, direccion, 
             activo, fecha_creacion, fecha_actualizacion, ultimo_login
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

// Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await testConnection();
    
    // Verificar si usuario existe
    const [existingUser] = await db.execute(
      'SELECT id FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Eliminar usuario (soft delete: marcar como inactivo)
    await db.execute(
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
    
    const db = await testConnection();
    
    // Obtener estado actual
    const [user] = await db.execute(
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
    await db.execute(
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
