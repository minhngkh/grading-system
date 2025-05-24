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
import { getRubrics } from "@/services/rubric-service";
import { Rubric } from "@/types/rubric";
import { useCallback, useEffect, useRef, useState } from "react";
import { GradingAttempt } from "@/types/grading";

interface ScrollableSelectProps {
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  onRubricChange?: (value: Rubric | undefined) => void;
  gradingAttempt: GradingAttempt;
}

export function RubricSelect({
  placeholder = "Select an item",
  emptyMessage = "No items found.",
  className,
  onRubricChange,
  gradingAttempt,
}: ScrollableSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<Rubric | undefined>();
  const [items, setItems] = useState<Rubric[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const search = useCallback(
    async (currentPage: number, search: string, resetItems = false) => {
      try {
        const result = await getRubrics(currentPage, pageSize, search);

        if (resetItems) {
          setItems(result.data);
        } else {
          setItems((prev) => [...prev, ...result.data]);
        }

        setHasMore(
          result.meta.total >
            (resetItems ? result.data.length : items.length + result.data.length),
        );
      } catch (error) {
        console.error("Error loading data:", error);
      }
    },
    [],
  );

  // Load data when popover opens
  useEffect(() => {
    async function LoadData() {
      setIsSearching(true);
      setPage(1);
      await search(1, debouncedSearchTerm, true);
      setIsSearching(false);
    }

    LoadData();
  }, [debouncedSearchTerm, search]);

  useEffect(() => {
    if (!gradingAttempt.rubricId || items.length === 0) return;

    const matchedRubric = items.find((item) => item.id === gradingAttempt.rubricId);
    if (matchedRubric) {
      setSelectedValue(matchedRubric);
    }
  }, [gradingAttempt.rubricId, items]);

  // Handle search input change
  const handleSearchChange = async (value: string) => {
    setSearchTerm(value);
  };

  // Handle scroll event to detect when user has scrolled to the bottom
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || isSearching) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // If scrolled to bottom (with a small threshold)
    if (scrollHeight - scrollTop - clientHeight < 50) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoading(true);
      await search(nextPage, searchTerm);
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedValue ? selectedValue.rubricName : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            placeholder="Search items..."
            value={searchTerm}
            disabled={isSearching}
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
              defaultValue={gradingAttempt.rubricId}
              ref={listRef}
              className="max-h-[300px] overflow-y-auto"
              onScroll={handleScroll}
            >
              {items.map((item) => (
                <CommandItem
                  className="flex justify-between"
                  key={item.id}
                  value={item.id}
                  onSelect={() => {
                    setSelectedValue(item);
                    onRubricChange?.(item);
                    setOpen(false);
                  }}
                >
                  {item.rubricName}
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      selectedValue?.id === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
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
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
