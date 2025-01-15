# Puppeteer Express API

A powerful RESTful API service that exposes Puppeteer's core functionality through HTTP endpoints. This service provides a robust interface for web scraping, PDF generation, screenshot capture, and DOM manipulation with built-in support for handling dynamic content and JavaScript execution.

## Features

- Screenshot capture with customizable viewport
- PDF generation with formatting options
- Full page content extraction with DOM evaluation
- Visible text extraction with structure preservation
- Custom JavaScript execution
- Performance metrics collection
- Anti-bot detection measures
- Secure containerized environment

## Technology Stack

- Node.js
- Express.js
- Puppeteer
- Docker
- Chrome/Chromium

## Installation

### Prerequisites

- Node.js >= 18
- npm or yarn
- Docker (for containerized deployment)
- Chrome/Chromium (installed automatically in Docker)

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd puppet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   PORT=3000
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Docker Setup

1. Using Docker Compose (recommended):
   ```bash
   docker-compose up -d
   ```

2. Using Docker directly:
   ```bash
   docker build -t puppeteer-api .
   docker run -p 3000:3000 -d puppeteer-api
   ```

## API Documentation

### GET /api/screenshot
Captures screenshots of webpages with customizable options.

**Parameters:**
- `url` (required): Target webpage URL
- `fullPage` (optional): Capture full page length (default: false)
- `width` (optional): Viewport width in pixels
- `height` (optional): Viewport height in pixels

**Example:**
```bash
curl "http://localhost:3000/api/screenshot?url=https://example.com&fullPage=true" --output screenshot.png
```

### GET /api/pdf
Generates PDF documents from webpages.

**Parameters:**
- `url` (required): Target webpage URL
- `format` (optional): Paper format (A4, Letter, etc.)
- `landscape` (optional): Landscape orientation (default: false)

**Example:**
```bash
curl "http://localhost:3000/api/pdf?url=https://example.com&format=A4&landscape=true" --output document.pdf
```

### GET /api/content
Extracts full HTML content after DOM evaluation.

**Parameters:**
- `url` (required): Target webpage URL
- `selector` (optional): CSS selector to extract specific content

**Example:**
```bash
curl "http://localhost:3000/api/content?url=https://example.com&selector=.main-content"
```

### GET /api/text
Extracts visible text content with preserved structure.

**Parameters:**
- `url` (required): Target webpage URL

**Example:**
```bash
curl "http://localhost:3000/api/text?url=https://example.com"
```

### POST /api/evaluate
Executes custom JavaScript on the webpage.

**Parameters:**
- `url` (required): Target webpage URL
- `script` (required): JavaScript code to execute

**Example:**
```bash
curl -X POST "http://localhost:3000/api/evaluate?url=https://example.com" \
  -H "Content-Type: application/json" \
  -d '{"script": "document.title"}'
```

### GET /api/metrics
Retrieves performance metrics and timing data.

**Parameters:**
- `url` (required): Target webpage URL

**Example:**
```bash
curl "http://localhost:3000/api/metrics?url=https://example.com"
```

## Anti-Bot Detection Features

The service includes several measures to avoid bot detection:

- Random user agent rotation
- Realistic browser headers
- Mouse movement simulation
- Proper timing delays
- Chrome-specific properties
- WebDriver detection bypass

## Docker Configuration

### Resource Limits
```yaml
limits:
  cpus: '2'
  memory: 2G
reservations:
  cpus: '1'
  memory: 1G
```

### Volumes
- `/home/pptruser/Downloads`: Persistent storage for generated files
- `/tmp`: Temporary Chrome storage

### Security
- Non-root user execution
- Limited capabilities
- No privilege escalation
- Secure Chrome flags

## Error Handling

The API implements comprehensive error handling for:

- Network timeouts
- Invalid URLs
- Missing resources
- Browser crashes
- Memory limits
- Selector errors
- JavaScript execution errors

## Best Practices

1. **Resource Management**
   - Use appropriate timeouts
   - Clean up browser instances
   - Monitor memory usage

2. **Performance**
   - Reuse browser instances when possible
   - Use selectors for specific content
   - Implement proper caching

3. **Security**
   - Validate input URLs
   - Sanitize JavaScript code
   - Use rate limiting
   - Implement access controls

## Troubleshooting

### Common Issues

1. **Chrome Crashes**
   - Increase container memory limits
   - Check for invalid URLs
   - Verify Chrome flags

2. **Timeout Errors**
   - Adjust wait conditions
   - Check network connectivity
   - Increase timeout values

3. **Memory Issues**
   - Monitor container resources
   - Implement garbage collection
   - Close unused pages

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License - see LICENSE file for details
