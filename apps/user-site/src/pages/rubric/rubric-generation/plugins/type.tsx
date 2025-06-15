export interface PluginDialogConfigProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCriterionConfigChange?: (config: string, criterionIndex: number) => void;
  criterionIndex: number;
}

export type PluginDialogComponent = React.FC<PluginDialogConfigProps>;
