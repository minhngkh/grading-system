import { flatConfig as pluginNext } from '@next/eslint-plugin-next';
import baseConfig from '../../eslint.config.mjs';

export default baseConfig.append([pluginNext.recommended]);
