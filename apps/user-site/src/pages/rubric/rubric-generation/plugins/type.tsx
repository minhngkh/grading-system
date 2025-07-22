export interface PluginConfigProps {
  configId?: string;
  onCriterionConfigChange: (config: string) => void;
  onCancel: () => void;
}

export type PluginComponent = React.FC<PluginConfigProps>;
