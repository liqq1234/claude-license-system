'use strict'

const config = require('../../config')
const winston = require('winston');

const label = winston.format.label({ label: config.name})
const timestamp = winston.format.timestamp()
const format = winston.format.printf(info => 
  `${info.timestamp} [${info.label}] ${info.level}: ${typeof(info.message) == 'string' ? info.message : JSON.stringify(info.message)}`
)

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    label, timestamp, format
  ),
  transports: []
});

// 添加控制台输出
logger.add(new winston.transports.Console({
  format,
  level: 'debug',
  colorize: true
}));

// 生产环境添加文件输出
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

module.exports = logger;

