const cron = require('node-cron');
import { TimedOut } from "./cronJob/TimedOut";



// shift pharmacy/lab timed out order to master table with timeout status
cron.schedule("* */1 * * *", () => {
    new TimedOut().orderTimedOut();
    new TimedOut().labOrderTimedOut();
});

