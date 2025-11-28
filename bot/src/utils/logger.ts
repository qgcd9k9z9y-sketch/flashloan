/**
 * Winston Logger Configuration
 * 
 * Centralized logging for the arbitrage bot
 */

import winston from 'winston';
import config from '../config/config';
import * as fs from 'fs';
import * as path from 'path';

// Ensure log directory exists
const logDir = path.dirname(config.logging.logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: config.logging.level,
  }),
];

// Add file transport if enabled
if (config.logging.enableFileLogging) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.logFilePath,
      format: customFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan or other middleware
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
