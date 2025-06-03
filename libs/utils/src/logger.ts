// TODO: move to using pino

import process from "node:process";
import { createLogger, format, transports } from "winston";

const formatMeta = (meta: object) => {
  let metaString = "";

  if ("stack" in meta) {
    metaString += meta.stack;
    delete meta.stack;
  }

  if (typeof meta === "string") {
    metaString += meta;
  }

  if (typeof meta === "object" && Object.keys(meta).length) {
    metaString += `\n${JSON.stringify(meta, null, 2)}`;
  }

  return metaString;
};

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

    if (typeof timestamp === "string") {
      prettyString += `${timestamp} `;
    }
    if (level) {
      prettyString += `${level} `;
    }
    if (typeof label === "string") {
      prettyString += `[${label.toUpperCase()}] `;
    }
    prettyString += message;
    if (Object.keys(meta).length) {
      prettyString += ` ${formatMeta(meta)}`;
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
