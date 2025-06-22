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
import { useCallback, useEffect, useRef, useState, memo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { GetAllResult, SearchParams } from "@/types/search-params";

const PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 10;
const DEBOUNCE_DELAY = 500;

interface Item {
  id: string;
}

interface ScrollableSelectProps<T extends Item> {
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  value?: string;
  onValueChange: (value: T) => any;
  searchFn: (params: SearchParams, token: string) => Promise<GetAllResult<T>>;
  selectFn: (item: T) => string;
}

function ScrollableSelect<T extends Item>({
  placeholder = "Select an item",
  emptyMessage = "No items found.",
  className,
  value,
  onValueChange,
  searchFn,
  selectFn,
}: ScrollableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<T | undefined>();
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  const fetchItems = useCallback(
    async (currentPage: number, term: string, resetItems = false) => {
      setIsSearching(true);
      try {
        if (!searchFn) return;

        const token = await auth.getToken();
        if (!token) {
          throw new Error("Unauthorized: No token found");
        }

        const params = {
          page: currentPage,
          perPage: PAGE_SIZE,
          search: term.trim(),
        };

        const result = await searchFn(params, token);

        setItems((prev) => {
          const combined = resetItems ? result.data : [...prev, ...result.data];

          setHasMore(
            result.meta.total >
              (resetItems ? result.data.length : prev.length + result.data.length),
          );

          return combined;
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [searchFn],
  );

  useEffect(() => {
    const loadData = async () => {
      setPage(1);
      await fetchItems(1, debouncedSearchTerm, true);
    };

    if (!isSearching) loadData();
  }, [debouncedSearchTerm, fetchItems]);

  useEffect(() => {
    if (!value || items.length === 0) return;

    const matchedItem = items.find((item) => item.id === value);
    if (matchedItem && matchedItem.id !== selectedValue?.id) {
      setSelectedValue(matchedItem);
    }
  }, [value, items.length, selectedValue?.id]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || loading || isSearching) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
        const nextPage = page + 1;
        setPage(nextPage);
        setLoading(true);
        await fetchItems(nextPage, searchTerm);
        setLoading(false);
      }
    },
    [hasMore, loading, isSearching, page, searchTerm, fetchItems],
  );

  const handleItemSelect = useCallback(
    (item: T) => {
      setSelectedValue(item);
      onValueChange?.(item);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedValue ? selectFn?.(selectedValue) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            placeholder="Search items..."
            value={searchTerm}
            onValueChange={handleSearchChange}
          />
          <CommandEmpty>
            {isSearching ?
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            : emptyMessage}
          </CommandEmpty>
          <CommandGroup>
            <CommandList
              defaultValue={value}
              ref={listRef}
              className="max-h-[150px] overflow-y-auto"
              onScroll={handleScroll}
            >
              {items.map((item) => (
                <CommandItem
                  className="flex justify-between"
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleItemSelect(item)}
                >
                  {selectFn ? selectFn(item) : item.id}
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      selectedValue?.id === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
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

const ScrollableSelectMemo = memo(ScrollableSelect) as <T extends Item>(
  props: ScrollableSelectProps<T>,
) => JSX.Element;

export { ScrollableSelectMemo };
