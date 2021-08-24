import expressApp from "./app";
import { get } from "config";
import { logger } from "./logger";
import moment = require("moment");
const {
	SERVER: { PORT },
}: any = get("APP");

expressApp.listen(PORT || 3000, () => {
	logger.info(`${moment().format('YYYY-MM-DD hh:mm')} Express server listening on port: ${PORT}`)
	console.info(`Express server listening on port: `, PORT);
});
