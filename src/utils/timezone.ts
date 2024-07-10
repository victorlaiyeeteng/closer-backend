import { format, parseISO } from "date-fns";
import { toZonedTime } from 'date-fns-tz';


export function convertToTimeZone(timestampWithTz: string, timeZone: string): string {
    const parsedDate = parseISO(timestampWithTz);
    const zonedDate = toZonedTime(parsedDate, timeZone);
    const formattedDate = format(zonedDate, 'yyyy-MM-dd HH:mm:ssXXX');
    return formattedDate;
}

// const inputTimestamp = "2024-07-11 09:00:00+08"; // Note the ISO 8601 format
// const targetTimeZone = "America/New_York";
// const localTimestamp = convertToTimeZone(inputTimestamp, targetTimeZone);
// console.log(localTimestamp); // Outputs the local timestamp in the given timezone
