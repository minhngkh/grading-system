import type { Control } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import type { CodeRunnerConfig } from "@/types/plugin";

interface OutputComparisonSettingsProps {
  control: Control<CodeRunnerConfig>;
}

export default function OutputComparisonSettings({ control }: OutputComparisonSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Output Comparison Settings</CardTitle>
        <CardDescription>
          Configure how test outputs are compared against expected results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="outputComparison.ignoreWhitespace"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Ignore Whitespace</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Ignore whitespace differences in output comparison
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="outputComparison.ignoreLineEndings"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Ignore Line Endings</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Ignore line ending differences (CRLF vs LF)
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="outputComparison.trim"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Trim Output</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Remove leading and trailing whitespace before comparison
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="outputComparison.ignoreCase"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <FormLabel>Ignore Case</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Ignore case differences in output comparison
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
