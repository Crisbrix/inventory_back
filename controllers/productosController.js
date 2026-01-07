const { query } = require('../config/database');

const productosController = {
  // Crear un nuevo producto
  async create(req, res) {
    try {
      console.log('Request body received:', req.body);
      const { nombre, codigo, descripcion, precio, stock_actual, stock_minimo } = req.body;
      
      console.log('Extracted precio:', precio);

      // Validaciones
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del producto es requerido'
        });
      }

      // Generar código automático si no se proporciona
      let codigoProducto = codigo;
      
      if (!codigoProducto) {
        // Obtener el último ID de producto
        const [lastProduct] = await query(
          'SELECT id FROM productos ORDER BY id DESC LIMIT 1'
        );
        
        const nextId = lastProduct ? lastProduct.id + 1 : 1;
        codigoProducto = `PROD-${String(nextId).padStart(4, '0')}`;
        
        // Verificar que el código generado no exista (por si acaso)
        let exists = true;
        let counter = 0;
        while (exists && counter < 100) {
          const [existing] = await query(
            'SELECT id FROM productos WHERE codigo = ?',
            [codigoProducto]
          );
          
          if (!existing) {
            exists = false;
          } else {
            const newId = (lastProduct ? lastProduct.id : 0) + counter + 1;
            codigoProducto = `PROD-${String(newId).padStart(4, '0')}`;
            counter++;
          }
        }
      } else {
        // Si se proporciona un código, verificar que no exista
        const [existingProduct] = await query(
          'SELECT id FROM productos WHERE codigo = ?',
          [codigoProducto]
        );

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'El código del producto ya existe'
          });
        }
      }

      // Insertar el producto
      const result = await query(
        'INSERT INTO productos (nombre, codigo, descripcion, precio, stock_actual, stock_minimo, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, codigoProducto, descripcion || null, precio || 0, stock_actual || 0, stock_minimo || 0, true]
      );

      // Obtener el producto creado
      const [newProduct] = await query(
        'SELECT * FROM productos WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Producto registrado exitosamente',
        data: newProduct
      });
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar el producto',
        error: error.message
      });
    }
  },

  // Obtener todos los productos
  async getAll(req, res) {
    try {
      const productos = await query(
        'SELECT * FROM productos WHERE activo = true ORDER BY nombre ASC'
      );

      res.json({
        success: true,
        data: productos
      });
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los productos',
        error: error.message
      });
    }
  },

  // Obtener un producto por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const [producto] = await query(
        'SELECT * FROM productos WHERE id = ?',
        [id]
      );

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: producto
      });
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el producto',
        error: error.message
      });
    }
  },

  // Actualizar un producto
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, codigo, descripcion, precio, stock_actual, stock_minimo, activo } = req.body;

      // Verificar si el producto existe
      const [existingProduct] = await query(
        'SELECT * FROM productos WHERE id = ?',
        [id]
      );

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar si el código ya existe en otro producto (si se proporciona)
      if (codigo && codigo !== existingProduct.codigo) {
        const [codeExists] = await query(
          'SELECT id FROM productos WHERE codigo = ? AND id != ?',
          [codigo, id]
        );

        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: 'El código del producto ya existe'
          });
        }
      }

      // Actualizar el producto
      await query(
        'UPDATE productos SET nombre = ?, codigo = ?, descripcion = ?, precio = ?, stock_actual = ?, stock_minimo = ?, activo = ? WHERE id = ?',
        [
          nombre || existingProduct.nombre,
          codigo !== undefined ? codigo : existingProduct.codigo,
          descripcion !== undefined ? descripcion : existingProduct.descripcion,
          precio !== undefined ? precio : existingProduct.precio,
          stock_actual !== undefined ? stock_actual : existingProduct.stock_actual,
          stock_minimo !== undefined ? stock_minimo : existingProduct.stock_minimo,
          activo !== undefined ? activo : existingProduct.activo,
          id
        ]
      );

      // Obtener el producto actualizado
      const [updatedProduct] = await query(
        'SELECT * FROM productos WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: updatedProduct
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el producto',
        error: error.message
      });
    }
  },

  // Eliminar (desactivar) un producto
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar si el producto existe
      const [existingProduct] = await query(
        'SELECT * FROM productos WHERE id = ?',
        [id]
      );

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Desactivar el producto (soft delete)
      await query(
        'UPDATE productos SET activo = false WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el producto',
        error: error.message
      });
    }
  }
};

module.exports = productosController;

