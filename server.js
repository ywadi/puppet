require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const puppeteerRoutes = require('./routes/puppeteer');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', puppeteerRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
