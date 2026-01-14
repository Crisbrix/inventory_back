module.exports = async (req, res) => {
  try {
    console.log('=== SIMPLE DEBUG TEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    
    // Test simple sin dependencias
    const test = {
      status: 'OK',
      message: 'Simple debug working',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      environment: {
        node_version: process.version,
        platform: process.platform
      }
    };
    
    res.json(test);
  } catch (error) {
    console.error('Simple debug error:', error);
    res.status(500).json({
      error: 'Simple debug error',
      message: error.message
    });
  }
};
