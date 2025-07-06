export interface PluginDialogConfigProps {
  configId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCriterionConfigChange: (config: string) => void;
}

export type PluginDialogComponent = React.FC<PluginDialogConfigProps>;
