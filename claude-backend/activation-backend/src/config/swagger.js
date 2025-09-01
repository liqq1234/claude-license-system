const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'License Server API',
      version: '1.0.0',
      description: 'Node.js License Server API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:8888',
        description: 'Development server',
      },
    ],
  },
  apis: [
    './src/controllers/api.js',
    './src/controllers/auth.js',
    './src/controllers/admin.js',
    './src/controllers/emailActivation.js'
  ],
}

const specs = swaggerJSDoc(options)

module.exports = {
  swaggerUi,
  specs
}

