import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { SearchParams } from "@/types/search-params";
import { InfiniteQueryOption } from "@/types/query";

const PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 10;
const DEBOUNCE_DELAY = 250;

interface Item {
  id: string;
}

interface ScrollableSelectProps<T extends Item> {
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  value?: T;
  onValueChange: (value: T) => void;
  selectFn: (item: T) => string;
  queryOptionsFn: (searchParams: SearchParams) => InfiniteQueryOption<T>;
}

function ScrollableSelect<T extends Item>({
  placeholder = "Select an item",
  emptyMessage = "No items found.",
  className,
  value,
  onValueChange,
  selectFn,
  queryOptionsFn,
}: ScrollableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      queryOptionsFn({
        search: debouncedSearchTerm,
        page: 1,
        perPage: PAGE_SIZE,
      }),
    );

  const items = data?.pages.flatMap((page) => page.data) ?? [];

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const nearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
      if (nearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const handleSelect = (item: T) => {
    onValueChange(item);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("justify-between", className)}
        >
          {value ? selectFn(value) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search items..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {items.length === 0 && !isFetching ?
            <CommandEmpty>{emptyMessage}</CommandEmpty>
          : <CommandGroup>
              <CommandList
                defaultValue={value?.id}
                className="max-h-[150px] overflow-y-auto"
                onScroll={handleScroll}
              >
                {items.map((item) => (
                  <CommandItem
                    className="flex justify-between"
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                  >
                    {selectFn(item)}
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value?.id === item.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading more...
                    </span>
                  </div>
                )}
              </CommandList>
            </CommandGroup>
          }
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const ScrollableSelectMemo = memo(ScrollableSelect) as <T extends Item>(
  props: ScrollableSelectProps<T>,
) => JSX.Element;
