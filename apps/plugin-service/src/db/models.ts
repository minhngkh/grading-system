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

  @prop({ required: true, unique: true })
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

export abstract class BasePluginConfig {}

enum PluginConfigType {
  AI = "ai",
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

@modelOptions({ schemaOptions: { collection: "plugins.configs" } })
export class PluginConfig extends TimeStamps {
  @prop({ ref: () => Plugin, required: true })
  public plugin!: Ref<Plugin>;

  @prop({
    required: true,
    type: () => BasePluginConfig,
    discriminators: () => [{ type: AIPluginConfig, value: PluginConfigType.AI }],
  })
  public config!: BasePluginConfig;
}

export const PluginConfigModel = getModelForClass(PluginConfig);
