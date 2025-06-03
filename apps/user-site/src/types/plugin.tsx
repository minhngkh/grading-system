import z from "zod";

export const PluginSchema = z.object({
  alias: z.string().min(1, "Plugin alias is required"),
  name: z.string().min(1, "Plugin name is required"),
  description: z.string().min(1, "Plugin description is required"),
  categories: z.array(z.string().min(1, "Plugin category is required")),
  enabled: z.boolean().default(true),
});

export const PluginListSchema = z.array(PluginSchema);

export type Plugin = z.infer<typeof PluginSchema>;
