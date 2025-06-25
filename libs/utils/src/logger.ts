// TODO: move to using pino

import process from "node:process";
import util from "node:util";
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
  format.printf((info) => {
    const { level, message, label, timestamp, ...meta } = info;

    let prettyString = "";

    // if (typeof timestamp === "string") {
    //   prettyString += `${timestamp} `;
    // }
    if (level) {
      prettyString += `${level} `;
    }
    if (typeof label === "string") {
      prettyString += `[${label.toUpperCase()}] `;
    }
    prettyString += message;

    const props = meta[Symbol.for("splat")];
    if (Array.isArray(props) && props.length !== 0) {
      let first = true;
      for (const prop of props) {
        prettyString += `${first ? ": " : "\n"}${util.inspect(prop, false, undefined, true)}`;
        first = false;
      }
    }

    prettyString += "\n";

    return prettyString;
  }),
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
