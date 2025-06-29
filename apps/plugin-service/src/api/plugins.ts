import "zod-openapi/extend";

import type { ServiceBroker } from "moleculer";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import z from "zod";
import * as categoryService from "@/services/category";
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

  // Get plugin by ID or alias
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

      // Try to find by ID first, then by alias
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

  return app;
}
