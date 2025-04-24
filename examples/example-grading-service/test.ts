import { type Context, ServiceBroker } from "moleculer";
import { ZodParams, type ZodParamsOptionsType } from "moleculer-zod-validator";
import { z, type ZodRawShape } from "zod";

const broker = new ServiceBroker({
  // validator: true,
})


const ObjSchema = new ZodParams({
  str: z.string(),
  num: z.number(),
});

const event = {
  name: "test",
  validate: ObjSchema,
}

interface Event<T extends ZodRawShape, U extends ZodParamsOptionsType = ZodParamsOptionsType, V = any> {
  name: string;
  validate: ZodParams<T, U>;
}

const schema = {
  str: z.string(),
  num: z.number(),
}

const e2: Event<typeof schema> = {
  name: "test",
  validate: new ZodParams(schema),
};

function createEvent<T extends ZodRawShape>(name: string, schema: T): Event<T> {
  return {
      name,
      validate: new ZodParams(schema),
  }
}

const e3 = createEvent("test", schema);


function emitEvent(e: typeof event, data: typeof e.validate.call) {
  broker.emit(e.name, data)
}

emitEvent(event, { str: "test", num: 1 }) // OK

