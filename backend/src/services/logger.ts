// backend/src/services/logger.ts
// Updated: 2026-04-17 | Winston 3.19

import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    }),
  ],
  // Winston 3.19: exceptionHandlers and rejectionHandlers recommended
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    }),
  ],
});
