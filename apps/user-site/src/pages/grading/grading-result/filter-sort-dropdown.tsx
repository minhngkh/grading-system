import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown, Settings, X, Check } from "lucide-react";

interface FilterSortDropdownProps {
  appliedMinScore: string;
  appliedMaxScore: string;
  appliedSortOrder: "asc" | "desc" | "none";
  onApplyFilters: (
    minScore: string,
    maxScore: string,
    sortOrder: "asc" | "desc" | "none",
  ) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function FilterSortDropdown({
  appliedMinScore,
  appliedMaxScore,
  appliedSortOrder,
  onApplyFilters,
  onClearAll,
  hasActiveFilters,
}: FilterSortDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Temporary filters/sort (used in dropdown before applying)
  const [tempMinScore, setTempMinScore] = useState("");
  const [tempMaxScore, setTempMaxScore] = useState("");
  const [tempSortOrder, setTempSortOrder] = useState<"asc" | "desc" | "none">("none");

  const applyFilters = () => {
    onApplyFilters(tempMinScore, tempMaxScore, tempSortOrder);
    setDropdownOpen(false);
  };

  const handleDropdownOpenChange = (open: boolean) => {
    if (open) {
      setTempMinScore(appliedMinScore);
      setTempMaxScore(appliedMaxScore);
      setTempSortOrder(appliedSortOrder);
    }
    setDropdownOpen(open);
  };

  const handleClearAll = () => {
    onClearAll();
    setDropdownOpen(false);
  };

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Filter & Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-4 space-y-4">
        {/* Score Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Score
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={tempMinScore}
              onChange={(e) => setTempMinScore(e.target.value)}
              className="w-20"
              step="0.1"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={tempMaxScore}
              onChange={(e) => setTempMaxScore(e.target.value)}
              className="w-20"
              step="0.1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </div>
          <Select
            value={tempSortOrder}
            onValueChange={(value: "asc" | "desc" | "none") => setTempSortOrder(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Sort</SelectItem>
              <SelectItem value="desc">High to Low</SelectItem>
              <SelectItem value="asc">Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full flex gap-2 mt-4">
          <Button className="flex-1" onClick={applyFilters}>
            <Check className="h-4 w-4" />
            Apply
          </Button>
          {hasActiveFilters && (
            <Button className="flex-1" variant="outline" onClick={handleClearAll}>
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
