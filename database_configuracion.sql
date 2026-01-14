-- =========================================
-- TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =========================================
CREATE TABLE configuracion_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion VARCHAR(255),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================
-- INSERTAR CONFIGURACIÓN POR DEFECTO
-- =========================================
INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
('nombre_empresa', 'Inventory System', 'Nombre de la empresa'),
('logo_url', '', 'URL del logo de la empresa'),
('tema', 'light', 'Tema de la interfaz (light, dark, auto)'),
('idioma', 'es', 'Idioma por defecto'),
('formato_fecha', 'DD/MM/YYYY', 'Formato de fecha'),
('email_alertas', 'true', 'Habilitar alertas por email'),
('email_reportes', 'true', 'Habilitar reportes por email'),
('email_bajo_stock', 'true', 'Habilitar alertas de bajo stock'),
('notificaciones_push', 'false', 'Habilitar notificaciones push'),
('frecuencia_reportes', 'semanal', 'Frecuencia de reportes (diario, semanal, mensual)');

-- =========================================
-- ÍNDICES PARA CONFIGURACIÓN
-- =========================================
CREATE INDEX idx_configuracion_clave ON configuracion_sistema(clave);
