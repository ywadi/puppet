const express = require('express');
const { body, query, validationResult } = require('express-validator');
const puppeteerService = require('../services/puppeteerService');

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// URL validation
const urlValidation = query('url').isURL().withMessage('Valid URL is required');

// Screenshot endpoint
router.get('/screenshot',
    urlValidation,
    query('width').optional().isInt(),
    query('height').optional().isInt(),
    query('fullPage').optional().isBoolean(),
    validate,
    async (req, res, next) => {
        try {
            const screenshot = await puppeteerService.takeScreenshot(req.query.url, req.query);
            res.type('image/png').send(screenshot);
        } catch (error) {
            next(error);
        }
    }
);

// PDF endpoint
router.get('/pdf',
    urlValidation,
    query('format').optional(),
    query('landscape').optional().isBoolean(),
    validate,
    async (req, res, next) => {
        try {
            const pdf = await puppeteerService.generatePDF(req.query.url, req.query);
            res.type('application/pdf').send(pdf);
        } catch (error) {
            next(error);
        }
    }
);

// Content endpoint
router.get('/content',
    urlValidation,
    query('selector').optional(),
    validate,
    async (req, res, next) => {
        try {
            const content = await puppeteerService.getPageContent(req.query.url, req.query.selector);
            res.json({ content });
        } catch (error) {
            next(error);
        }
    }
);

// Evaluate endpoint
router.post('/evaluate',
    urlValidation,
    body('script').isString().notEmpty(),
    validate,
    async (req, res, next) => {
        try {
            const result = await puppeteerService.evaluateScript(req.query.url, req.body.script);
            res.json({ result });
        } catch (error) {
            next(error);
        }
    }
);

// Metrics endpoint
router.get('/metrics',
    urlValidation,
    validate,
    async (req, res, next) => {
        try {
            const metrics = await puppeteerService.getMetrics(req.query.url);
            res.json(metrics);
        } catch (error) {
            next(error);
        }
    }
);

// Extract text endpoint
router.get('/text',
    urlValidation,
    validate,
    async (req, res, next) => {
        try {
            const text = await puppeteerService.extractText(req.query.url);
            res.json({ text });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
