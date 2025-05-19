import process from "node:process";
import { createLogger, format, transports } from "winston";

const defaultFormat = format.combine(
  format.colorize(),
  format.uncolorize(),
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  format.prettyPrint({
    depth: 5,
  }),
);

const prettyFormat = format.combine(
  format.colorize(),
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  format.prettyPrint({
    depth: 0,
  }),
  format.printf(
    ({ timestamp, level, message, ...meta }) =>
      `${timestamp} ${level}: ${message}\n${JSON.stringify(meta, null, 2).replace(/^/gm, " ")}`,
  ),
);

const logger = createLogger(
  process.env.NODE_ENV !== "production" ?
    {
      level: process.env.LOG_LEVEL ?? "info",
      transports: [
        new transports.Console({
          format: prettyFormat,
        }),
      ],
    }
  : {
      level: process.env.LOG_LEVEL ?? "info",
      transports: [
        new transports.Console({
          format: defaultFormat,
        }),
      ],
    },
);

export default logger;
