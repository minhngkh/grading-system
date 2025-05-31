import { useState, useEffect } from "react";
import { Rubric, RubricStatus } from "@/types/rubric";
import { GetRubricsResult, RubricService } from "@/services/rubric-service";
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
import EditRubric from "@/components/app/edit-rubric";
import { toast } from "sonner";
import { ViewRubricDialog } from "@/components/app/view-rubric-dialog";

type SortConfig = {
  key: "rubricName" | "updatedOn" | "status" | null;
  direction: "asc" | "desc";
};

interface ManageRubricsPageProps {
  searchParams: SearchParams;
  results: GetRubricsResult;
  setSearchParam: (partial: Partial<SearchParams>) => void;
}

export default function ManageRubricsPage({
  searchParams,
  setSearchParam,
  results,
}: ManageRubricsPageProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "rubricName",
    direction: "desc",
  });
  const { page, perPage } = searchParams;
  const {
    data: rubrics,
    meta: { total: totalCount },
  } = results;
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.search || "");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [viewRubricOpen, setViewRubricOpen] = useState<boolean>(false);
  const [editRubricOpen, setEditRubricOpen] = useState<boolean>(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  useEffect(() => {
    setSearchParam({
      search: debouncedSearchTerm,
      page: 1,
    });
  }, [debouncedSearchTerm]);

  // Apply client filtering for status only
  const filteredRubrics =
    statusFilter === "All" ? rubrics : (
      rubrics.filter((rubric) => rubric.status === statusFilter)
    );

  const sortedRubrics = [...filteredRubrics].sort((a, b) => {
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
  const paginatedData = sortedRubrics.slice(startIndex, startIndex + perPage);
  const totalPages = Math.ceil(sortedRubrics.length / perPage);

  const requestSort = (key: SortConfig["key"]) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Rubric) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }

    return sortConfig.direction === "asc" ?
        <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getStatusBadge = (status?: RubricStatus) => {
    switch (status) {
      case RubricStatus.Draft:
        return <Badge variant="default">Drafted</Badge>;
      case RubricStatus.Used:
        return <Badge variant="secondary">Used</Badge>;
      default:
        return <Badge variant="destructive">None</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const onUpdateRubric = async (id: string, updatedRubricData: Partial<Rubric>) => {
    try {
      await RubricService.updateRubric(id, updatedRubricData);
      toast.success("Rubric updated successfully");
    } catch (err) {
      toast.error("Failed to update rubric");
      console.error(err);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Rubrics</h2>
        <p className="text-muted-foreground">Manage your assessment rubrics</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="rubric_name"
            placeholder="Search rubrics..."
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
            <SelectItem value="Drafted">Drafted</SelectItem>
            <SelectItem value="Used">Used</SelectItem>
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
              <TableHead onClick={() => requestSort("rubricName")} className="w-[40%]">
                <div className="flex items-center cursor-pointer">
                  Rubric Name {getSortIcon("rubricName")}
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("updatedOn")} className="w-[20%]">
                <div className="flex items-center cursor-pointer">
                  Updated On {getSortIcon("updatedOn")}
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
                  No rubrics found.
                </TableCell>
              </TableRow>
            : paginatedData.map((rubric) => (
                <TableRow key={rubric.id}>
                  <TableCell className="font-semibold">{rubric.rubricName}</TableCell>
                  <TableCell>
                    {rubric.updatedOn ?
                      format(rubric.updatedOn, "MMM d, yyyy")
                    : "Not set"}
                  </TableCell>
                  <TableCell>{getStatusBadge(rubric.status)}</TableCell>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setViewRubricOpen(true);
                          }}
                        >
                          View Rubric
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditRubricOpen(true);
                          }}
                        >
                          Edit Rubric
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  {viewRubricOpen && (
                    <ViewRubricDialog
                      open={viewRubricOpen}
                      onOpenChange={setViewRubricOpen}
                      initialRubric={rubric}
                    />
                  )}
                  {editRubricOpen && (
                    <EditRubric
                      open={editRubricOpen}
                      onOpenChange={setEditRubricOpen}
                      rubricData={rubric}
                      onUpdate={(updatedRubric) => {
                        onUpdateRubric(rubric.id, updatedRubric);
                      }}
                    />
                  )}
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
              `Showing ${rubrics.length} of ${totalCount} rubrics`
            : `Showing ${paginatedData.length} of ${sortedRubrics.length} rubrics`}
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
