import "zod-openapi/extend";

import type { ServiceBroker } from "moleculer";
import logger from "@grading-system/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import z from "zod";
import { configurablePluginsMap, pluginConfigSchema, plugins } from "@/plugins/info";
import * as categoryService from "@/services/category";
import * as configService from "@/services/config";
import * as pluginService from "@/services/plugin";

// Schema definitions
const pluginResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  categories: z.array(z.string()),
  enabled: z.boolean(),
});

const pluginsResponseSchema = z.array(pluginResponseSchema);

const categoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

const categoriesResponseSchema = z.array(categoryResponseSchema);

export function route(_broker?: ServiceBroker) {
  const app = new Hono();

  // Get all categories
  app.get(
    "/categories",
    describeRoute({
      tags: ["General"],
      description: "Get all plugin categories",
      responses: {
        200: {
          description: "List of plugin categories",
          content: {
            "application/json": {
              schema: resolver(categoriesResponseSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      const categories = await categoryService.getAllCategories();
      const response = categories.map((cat) => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
      })) satisfies z.infer<typeof categoriesResponseSchema>;

      return c.json(response);
    },
  );

  // Get category by ID
  app.get(
    "/categories/:id",
    describeRoute({
      tags: ["General"],
      description: "Get category by ID",
      responses: {
        200: {
          description: "Category details",
          content: {
            "application/json": {
              schema: resolver(categoryResponseSchema),
            },
          },
        },
        404: {
          description: "Category not found",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id");
      const category = await categoryService.getCategoryById(id);

      if (!category) {
        return c.json({ error: "Category not found" }, 404);
      }

      const response = {
        id: category._id,
        name: category.name,
        description: category.description,
      } satisfies z.infer<typeof categoryResponseSchema>;

      return c.json(response);
    },
  );

  // Get all plugins
  app.get(
    "/plugins",
    describeRoute({
      tags: ["General"],
      description: "Get all plugins",
      responses: {
        200: {
          description: "List of plugins",
          content: {
            "application/json": {
              schema: resolver(pluginsResponseSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      // const category = c.req.query("category");

      const plugins = await pluginService.getAllPlugins();

      const response = plugins.map((plugin) => {
        return {
          id: plugin._id,
          name: plugin.name,
          description: plugin.description,
          categories: plugin.categories as string[],
          enabled: plugin.enabled,
        };
      }) satisfies z.infer<typeof pluginsResponseSchema>;

      return c.json(response);
    },
  );

  // Get plugin by ID
  app.get(
    "/plugins/:id",
    describeRoute({
      tags: ["General"],
      description: "Get plugin by ID",
      responses: {
        200: {
          description: "Plugin details",
          content: {
            "application/json": {
              schema: resolver(pluginResponseSchema),
            },
          },
        },
        404: {
          description: "Plugin not found",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id");

      const plugin = await pluginService.getPluginById(id);

      if (!plugin) {
        return c.json({ error: "Plugin not found" }, 404);
      }

      const response = {
        id: plugin._id,
        name: plugin.name,
        description: plugin.description,
        categories: plugin.categories as string[],
        enabled: plugin.enabled,
      } satisfies z.infer<typeof pluginResponseSchema>;

      return c.json(response);
    },
  );

  app.use("/plugins/:pluginId/configs/*", async (c, next) => {
    const pluginId = c.req.param("pluginId");

    if (!configurablePluginsMap.has(pluginId)) {
      return c.json({ error: "Invalid plugin" }, 404);
    }

    await next();
  });

  // Get plugin config by ID
  const getPluginConfigResponseSchema = pluginConfigSchema;

  app.get(
    "/plugins/:pluginId/configs/:configId",
    describeRoute({
      tags: ["Config"],
      description: "Get plugin config by ID",
      responses: {
        200: {
          description: "Config details",
          content: {
            "application/json": {
              schema: resolver(getPluginConfigResponseSchema),
            },
          },
        },
        404: {
          description: "Plugin config not found",
        },
      },
    }),
    async (c) => {
      const pluginId = c.req.param("pluginId");
      const configId = c.req.param("configId");

      const plugin = await configService.getConfigOfPlugin(configId, pluginId);

      if (!plugin) {
        return c.json({ error: "Plugin config not found" }, 404);
      }

      const response = plugin.config;

      return c.json(response);
    },
  );

  const createPluginConfigSchema = pluginConfigSchema;
  const createPluginConfigResponseSchema = z.object({
    id: z.string(),
  });

  app.post(
    "/plugins/:pluginId/configs",
    describeRoute({
      tags: ["Config"],
      description: "Create a new plugin config",
      responses: {
        201: {
          description: "Config created",
          content: {
            "application/json": {
              schema: resolver(createPluginConfigResponseSchema),
            },
          },
        },
      },
    }),
    validator("json", createPluginConfigSchema),
    async (c) => {
      const data = c.req.valid("json");
      const pluginId = c.req.param("pluginId");

      const pluginKey = configurablePluginsMap.get(pluginId)!;
      const check = plugins[pluginKey].checkConfig;

      if (check !== undefined && check.func(data as unknown as any)) {
        return c.json({ error: check.message }, 400);
      }

      const config = await configService.createConfig(data, pluginId);

      const response = {
        id: config._id.toString(),
      } satisfies z.infer<typeof createPluginConfigResponseSchema>;

      return c.json(response, 201);
    },
  );

  // Update plugin config
  const updatePluginConfigSchema = pluginConfigSchema;

  app.put(
    "/plugins/:pluginId/configs/:id",
    describeRoute({
      tags: ["Config"],
      description: "Update plugin config by ID",
      responses: {
        200: {
          description: "Config updated",
        },
        404: {
          description: "Plugin config not found",
        },
      },
    }),
    validator("json", updatePluginConfigSchema),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const pluginId = c.req.param("pluginId");

      const pluginKey = configurablePluginsMap.get(pluginId)!;
      const check = plugins[pluginKey].checkConfig;

      if (check !== undefined && check.func(data as unknown as any)) {
        return c.json({ error: check.message }, 400);
      }

      const config = await configService.updateConfig(id, data);

      if (!config) {
        return c.json({ error: "Plugin config not found" }, 404);
      }

      return c.text("", 200);
    },
  );

  return app;
}
