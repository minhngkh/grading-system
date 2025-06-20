import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchParams } from "@/types/search-params";
import { GradingAttempt, GradingStatus } from "@/types/grading";
import { Link } from "@tanstack/react-router";
import { GetGradingsResult } from "@/services/grading-service";

type SortConfig = {
  key: "id" | "lastModified" | "status" | null;
  direction: "asc" | "desc";
};

type ManageGradingsPageProps = {
  searchParams: SearchParams;
  results: GetGradingsResult;
  setSearchParam: (partial: Partial<SearchParams>) => void;
};

export default function ManageGradingsPage({
  searchParams,
  setSearchParam,
  results,
}: ManageGradingsPageProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "id",
    direction: "desc",
  });
  const { page, perPage } = searchParams;
  const {
    data: gradings,
    meta: { total: totalCount },
  } = results;
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.search || "");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  useEffect(() => {
    setSearchParam({
      search: debouncedSearchTerm,
      page: 1,
    });
  }, [debouncedSearchTerm]);

  // Apply client filtering for status only
  const filteredGradings =
    statusFilter === "All" ? gradings : (
      gradings.filter((grading) => grading.status === statusFilter)
    );

  const sortedGradings = [...filteredGradings].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aKey = a[sortConfig.key];
    const bKey = b[sortConfig.key];
    // Handle undefined or null values
    if (aKey == null && bKey == null) return 0;
    if (aKey == null) return sortConfig.direction === "asc" ? 1 : -1;
    if (bKey == null) return sortConfig.direction === "asc" ? -1 : 1;
    if (aKey < bKey) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aKey > bKey) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const startIndex = (page - 1) * perPage;
  const paginatedData = sortedGradings.slice(startIndex, startIndex + perPage);
  const totalPages = Math.ceil(sortedGradings.length / perPage);

  const requestSort = (key: SortConfig["key"]) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof GradingAttempt) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }

    return sortConfig.direction === "asc" ?
        <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getStatusBadge = (status?: GradingStatus) => {
    switch (status) {
      case GradingStatus.Completed:
        return <Badge variant="default">Completed</Badge>;
      case GradingStatus.Created:
        return <Badge variant="secondary">Created</Badge>;
      default:
        return <Badge variant="destructive">None</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Gradings</h2>
        <p className="text-muted-foreground">Manage your assessment gradings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="grading_name"
            placeholder="Search gradings..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="pl-8"
          />
          {searchTerm.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent hover:text-red-600"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setSearchParam({ page: 1 });
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {Object.values(GradingStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {GradingStatus[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {statusFilter !== "All" && (
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="w-full overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("id")} className="w-[40%]">
                <div className="flex items-center cursor-pointer">
                  ID {getSortIcon("id")}
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("lastModified")} className="w-[20%]">
                <div className="flex items-center cursor-pointer">
                  Last Modified {getSortIcon("lastModified")}
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="w-[20%]">
                <div className="flex items-center cursor-pointer">
                  Status {getSortIcon("status")}
                </div>
              </TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ?
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No gradings found.
                </TableCell>
              </TableRow>
            : paginatedData.map((grading) => (
                <TableRow key={grading.id}>
                  <TableCell className="font-semibold">{grading.id}</TableCell>
                  <TableCell>
                    {grading.lastModified ?
                      format(grading.lastModified, "MMM d, yyyy")
                    : "Not set"}
                  </TableCell>
                  <TableCell>{getStatusBadge(grading.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/gradings/$id" params={{ id: grading.id }}>
                            View Grading
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {statusFilter === "All" ?
              `Showing ${gradings.length} of ${totalCount} gradings`
            : `Showing ${paginatedData.length} of ${sortedGradings.length} gradings`}
          </p>
          <Select
            value={perPage.toString()}
            onValueChange={(value) => {
              setSearchParam({ perPage: Number.parseInt(value), page: 1 });
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchParam({ page: Math.max(page - 1, 1) });
            }}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;

              // Adjust page numbers for larger datasets
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i;
                if (pageNum > totalPages) return null;
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setSearchParam({ page: pageNum })}
                >
                  {pageNum}
                </Button>
              );
            })}

            {totalPages > 5 && page < totalPages - 2 && <span className="mx-1">...</span>}

            {totalPages > 5 && page < totalPages - 1 && (
              <Button
                variant={page === totalPages ? "default" : "outline"}
                size="icon"
                className="w-8 h-8"
                onClick={() => setSearchParam({ page: totalPages })}
              >
                {totalPages}
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSearchParam({ page: Math.min(page + 1, totalPages) })}
            disabled={page === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
