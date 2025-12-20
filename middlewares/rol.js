module.exports = (rolesPermitidos) => {
    return (req, res, next) => {
        const perfil = req.headers['perfil'];

        if (!perfil) {
            return res.status(401).json({
                mensaje: 'Perfil no enviado'
            });
        }

        if (!rolesPermitidos.includes(perfil)) {
            return res.status(403).json({
                mensaje: 'Acceso denegado por perfil'
            });
        }

        next();
    };
};
