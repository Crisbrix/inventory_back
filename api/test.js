module.exports = async (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};
