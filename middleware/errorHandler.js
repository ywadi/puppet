const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message
        });
    }

    if (err.name === 'PuppeteerError') {
        return res.status(500).json({
            error: 'Puppeteer Error',
            message: err.message
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong'
    });
};

module.exports = errorHandler;
