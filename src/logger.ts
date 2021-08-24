import { existsSync, mkdirSync } from 'fs';
import moment = require('moment');
import * as winston from 'winston';

const logDir: string = `./logs`;
const fileName = `${moment().format('YYYY_MM_DD')}.log`
if (!existsSync(logDir)) {
	mkdirSync(logDir);
}

export const logger = winston.createLogger({
	// level: 'error',
	format: winston.format.json(),
	transports: [
		// new winston.transports.Console(),
		new winston.transports.File({ filename: `${logDir}/${fileName}` }),
	]
});
