import { combine, react } from "@antfu/eslint-config"
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import baseConfig from '../../eslint.config.mjs'

export default combine(
  baseConfig,
  react(),
  ...pluginQuery.configs['flat/recommended'],
  ...pluginRouter.configs['flat/recommended'],
)
