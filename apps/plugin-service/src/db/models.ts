import type { Ref } from "@typegoose/typegoose";
import {
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
  Severity,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

@modelOptions({ schemaOptions: { collection: "plugins.categories" } })
export class PluginCategory extends TimeStamps {
  @prop()
  public _id!: string;

  @prop({ required: true })
  public name!: string;

  @prop()
  public description?: string;
}

export const PluginCategoryModel = getModelForClass(PluginCategory);

@modelOptions({ schemaOptions: { collection: "plugins" } })
export class Plugin extends TimeStamps {
  @prop()
  public _id!: string;

  @prop({ required: true })
  public name!: string; // User-friendly name, e.g., "AI Rubric Generator"

  @prop()
  public description?: string;

  @prop({ ref: () => PluginCategory, type: () => String })
  public categories!: Ref<PluginCategory, string>[];

  @prop({ default: true })
  public enabled!: boolean;
}

export const PluginModel = getModelForClass(Plugin);

@modelOptions({
  schemaOptions: {
    _id: false,
    discriminatorKey: "type",
  },
})
export abstract class BasePluginConfig {
  @prop({ required: true })
  public type!: string;
}

enum PluginConfigType {
  AI = "ai",
  TestRunner = "test-runner",
}

export class AIPluginConfig extends BasePluginConfig {
  @prop({ required: true })
  public model!: string; // e.g., "google:gemini-2.5-flash", "openai:gpt-4o-mini"

  @prop({ required: true })
  public promptTemplate!: string; // e.g., "Generate a rubric for {task}"

  @prop({
    allowMixed: Severity.ALLOW,
    type: () => mongoose.Schema.Types.Mixed,
    default: {},
  })
  public additionalSettings?: Record<string, any>; // e.g., temperature, max tokens
}

class TestCase {
  @prop({ required: true })
  public input!: string; // stdin input for the test case

  @prop({ required: true })
  public output!: string; // expected stdout output

  @prop()
  public description?: string; // optional description of the test case
}

export class TestRunnerConfig extends BasePluginConfig {
  @prop({ required: true })
  public runCommand!: string;

  @prop()
  public initCommand!: string;

  @prop({ _id: false, type: TestCase })
  public testCases!: TestCase[];
}

@modelOptions({ schemaOptions: { collection: "plugins.configs" } })
export class PluginConfig extends TimeStamps {
  // @prop({ ref: () => Plugin, type: () => String, required: true })
  // public plugin!: Ref<Plugin>;

  @prop({
    _id: false,
    required: true,
    type: BasePluginConfig,
    discriminators: () => [
      { type: AIPluginConfig, value: "ai" },
      { type: TestRunnerConfig, value: "test-runner" },
    ],
  })
  public config!: BasePluginConfig;
}

export const PluginConfigModel = getModelForClass(PluginConfig);
