import { defineEvent } from "@/utils/events";
import {
  defineEventHandler,
  defineTypedService,
  type InferTypedService,
  type TypedServiceInterface,
} from "@/utils/typed-moleculer";
import { z } from "zod";

const testEvent = defineEvent("test.event", {
  str: z.string(),
  num: z.number(),
});

type ITestService = TypedServiceInterface<{
  methods: {
    hello: () => string;
  };
}>;

type TestServiceThis = InferTypedService<ITestService>;

const testService: ITestService = defineTypedService({
  name: "test-service",

  settings: {
    // Configure service settings
  },
  methods: {
    hello() {
      return "Hello from test service!";
    },
  },
  events: {
    test(ctx) {
      this.hello();
    },
    // [testEvent.name]: {
    //   params: testEvent.validate.schema,
    //   handler: (ctx: Context<typeof testEvent.validate.context>) => {
    //     const {str, num} =  ctx.params; // ctx.params is now typed as { str: string; num: number; }
    //     // Handle the event
    //     console.log("Event received:", ctx.params);
    //   },
    // },
    [testEvent.name]: defineEventHandler(
      testEvent,
      function (this: TestServiceThis, ctx) {
        const { str, num } = ctx.params;
        this.hello();
        // Handle the event
        console.log("Event received:", ctx.params);
      }
    ),
  },
  actions: {
    chat: {
      handler(ctx) {
        return this.hello();
      },
    },
  }
});
