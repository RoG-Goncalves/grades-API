import express from 'express';
import gradesRouter from './routes/grades.js';
import winston from 'winston';

import { promises as fs } from 'fs';
const { writeFile, readFile } = fs;

global.fileName = 'grades.json';
//This is for recording logs-----------------------------------------------------
const { combine, timestamp, label, printf } = winston.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});
global.logger = winston.createLogger({
  level: 'silly',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'grades-api.log' }),
  ],
  format: combine(label({ label: 'grades-api' }), timestamp(), myFormat),
});
//------------------------------------------------------------------------------
class App {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.app.listen(3000, async () => {
      try {
        await readFile(global.fileName);
        global.logger.info('API STARTED!');
      } catch (err) {
        const initialJSON = {
          nextID: 1,
          grades: [],
        };
        writeFile(global.fileName, JSON.stringify(initialJSON)).catch((err) =>
          global.logger.error(err)
        );
      }
    });
    this.app.use('/grade', gradesRouter);
  }
}
new App();
