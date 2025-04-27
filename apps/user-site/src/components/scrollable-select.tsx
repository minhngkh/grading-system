import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { getRubrics } from "@/services/rubricService";
import { Rubric } from "@/types/rubric";

interface ScrollableSelectProps {
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  onChange?: (value: string) => void;
}

export function ScrollableSelect({
  placeholder = "Select an item",
  emptyMessage = "No items found.",
  className,
  onChange,
}: ScrollableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");
  const [items, setItems] = React.useState<Rubric[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const pageSize = 20;

  // Use the debounce hook for search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Load data based on current search and page
  const loadData = React.useCallback(
    async (currentPage: number, search: string, resetItems = false) => {
      setLoading(true);
      try {
        const result = await getRubrics(currentPage, pageSize, search);

        if (resetItems) {
          setItems(result.data);
        } else {
          setItems((prev) => [...prev, ...result.data]);
        }

        const hasMore = result.meta["total-items"] === items.length;
        setHasMore(hasMore);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [pageSize],
  );

  // Load initial data
  React.useEffect(() => {
    loadData(1, "", true);
  }, [loadData]);

  // React to changes in the debounced search term
  React.useEffect(() => {
    // Skip the initial render
    if (debouncedSearchTerm !== searchTerm) {
      return;
    }

    setPage(1);
    loadData(1, debouncedSearchTerm, true);
  }, [debouncedSearchTerm, loadData, searchTerm]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);
  };

  // Handle scroll event to detect when user has scrolled to the bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || isSearching) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If scrolled to bottom (with a small threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, debouncedSearchTerm);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedValue
            ? items.find((item) => item.rubricName === selectedValue)?.rubricName
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search items..."
            value={searchTerm}
            onValueChange={handleSearchChange}
          />
          <CommandEmpty>
            {isSearching ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : (
              emptyMessage
            )}
          </CommandEmpty>
          <CommandGroup>
            <CommandList
              ref={listRef}
              className="max-h-[300px] overflow-y-auto"
              onScroll={handleScroll}
            >
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.rubricName}
                  onSelect={(currentValue) => {
                    setSelectedValue(currentValue === selectedValue ? "" : currentValue);
                    onChange?.(currentValue === selectedValue ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === item.rubricName ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.rubricName}
                </CommandItem>
              ))}
              {/* Only show loading indicator here if we have items AND we're not searching */}
              {loading && !isSearching && items.length > 0 && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading more items...
                  </span>
                </div>
              )}
              {!hasMore && items.length > 0 && !isSearching && !loading && (
                <div className="py-2 text-center text-sm text-muted-foreground">
                  No more items to load
                </div>
              )}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
