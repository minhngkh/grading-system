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
  alias: z.string(),
  name: z.string(),
  description: z.string().optional(),
  categories: z.array(z.string()),
  enabled: z.boolean(),
});

const pluginsResponseSchema = z.array(pluginResponseSchema);

const categoryResponseSchema = z.object({
  alias: z.string(),
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
        alias: cat.alias,
        name: cat.name,
        description: cat.description,
      })) satisfies z.infer<typeof categoriesResponseSchema>;

      return c.json(response);
    },
  );

  // Get category by ID
  app.get(
    "/categories/:alias",
    describeRoute({
      tags: ["General"],
      description: "Get category by Alias",
      responses: {
        200: {
          description: "Category details",
          content: {
            "application/json": {
              schema: resolver(categoriesResponseSchema),
            },
          },
        },
        404: {
          description: "Category not found",
        },
      },
    }),
    async (c) => {
      const alias = c.req.param("alias");
      const category = await categoryService.getCategoryByAlias(alias);

      if (!category) {
        return c.json({ error: "Category not found" }, 404);
      }

      const response = {
        alias: category.alias,
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
              schema: resolver(z.array(pluginsResponseSchema)),
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
          alias: plugin.alias,
          name: plugin.name,
          description: plugin.description,
          categories: plugin.categories.map((cat) => {
            if (!("alias" in cat)) {
              throw new Error("Should never happen");
            }
            return cat.alias;
          }),
          enabled: plugin.enabled,
        };
      }) satisfies z.infer<typeof pluginsResponseSchema>;

      return c.json(response);
    },
  );

  // // Get plugins grouped by category
  // app.get(
  //   "/grouped",
  //   describeRoute({
  //     tags: ["Plugins"],
  //     description: "Get plugins grouped by category",
  //     responses: {
  //       200: {
  //         description: "Plugins grouped by category",
  //         content: {
  //           "application/json": {
  //             schema: resolver(z.record(z.string(), z.array(pluginSchema))),
  //           },
  //         },
  //       },
  //     },
  //   }),
  //   async (c) => {
  //     const grouped = await pluginService.getPluginsGroupedByCategory();
  //     return c.json(grouped);
  //   }
  // );

  // // Search plugins
  // app.get(
  //   "/search",
  //   describeRoute({
  //     tags: ["Plugins"],
  //     description: "Search plugins by name, alias, or description",
  //     responses: {
  //       200: {
  //         description: "Search results",
  //         content: {
  //           "application/json": {
  //             schema: resolver(z.array(pluginSchema)),
  //           },
  //         },
  //       },
  //       400: validationErrorResponse,
  //     },
  //   }),
  //   async (c) => {
  //     const query = c.req.query("q");
  //     if (!query) {
  //       return c.json({ error: "Query parameter 'q' is required" }, 400);
  //     }

  //     const enabledOnly = c.req.query("enabled") === "true";
  //     const results = await pluginService.searchPlugins(query, enabledOnly);

  //     return c.json(results);
  //   }
  // );

  // Get plugin by ID or alias
  app.get(
    "/plugins/:alias",
    describeRoute({
      tags: ["General"],
      description: "Get plugin by alias",
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
      const alias = c.req.param("alias");

      // Try to find by ID first, then by alias
      const plugin = await pluginService.getPluginByAlias(alias);

      if (!plugin) {
        return c.json({ error: "Plugin not found" }, 404);
      }

      const response = {
        alias: plugin.alias,
        name: plugin.name,
        description: plugin.description,
        categories: plugin.categories.map((cat) => {
          if (!("alias" in cat)) {
            throw new Error("Should never happen");
          }
          return cat.alias;
        }),
        enabled: plugin.enabled,
      } satisfies z.infer<typeof pluginResponseSchema>;

      return c.json(response);
    },
  );

  return app;
}
