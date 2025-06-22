import { useState, useEffect } from "react";
import { Rubric } from "@/types/rubric";
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
import { GetAllResult, SearchParams } from "@/types/search-params";
import { ViewRubricDialog } from "@/components/app/view-rubric-dialog";
import { ExportDialog } from "@/components/app/export-dialog";
import { RubricExporter } from "@/lib/exporters";
import { useRouter } from "@tanstack/react-router";

type SortConfig = {
  key: "rubricName" | "updatedOn" | null;
  direction: "asc" | "desc";
};

interface ManageRubricsPageProps {
  searchParams: SearchParams;
  results: GetAllResult<Rubric>;
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
  const [viewRubricOpen, setViewRubricOpen] = useState<boolean>(false);
  const [selectedRubricIndex, setSelectedRubricIndex] = useState<number | null>(null);
  const [exportRubricOpen, setExportRubricOpen] = useState<boolean>(false);
  const router = useRouter();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  useEffect(() => {
    setSearchParam({
      search: debouncedSearchTerm,
      page: 1,
    });
  }, [debouncedSearchTerm]);

  // Remove client filtering - use rubrics directly
  const sortedRubrics = [...rubrics].sort((a, b) => {
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

  const totalPages = Math.ceil(totalCount / perPage);

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

  const clearFilters = () => {
    setSearchTerm("");
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
        {searchTerm.length > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="w-full overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("rubricName")} className="w-[50%]">
                <div className="flex items-center cursor-pointer">
                  Rubric Name {getSortIcon("rubricName")}
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("updatedOn")} className="w-[30%]">
                <div className="flex items-center cursor-pointer">
                  Updated On {getSortIcon("updatedOn")}
                </div>
              </TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRubrics.length === 0 ?
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No rubrics found.
                </TableCell>
              </TableRow>
            : sortedRubrics.map((rubric, index) => (
                <TableRow key={index}>
                  <TableCell className="font-semibold">{rubric.rubricName}</TableCell>
                  <TableCell>
                    {rubric.updatedOn ?
                      format(rubric.updatedOn, "MMM d, yyyy")
                    : "Not set"}
                  </TableCell>
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
                            setSelectedRubricIndex(index);
                          }}
                        >
                          View Rubric
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            router.navigate({
                              to: "/rubrics/$id",
                              params: { id: rubric.id },
                            });
                          }}
                        >
                          Edit Rubric
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRubricIndex(index);
                            setExportRubricOpen(true);
                          }}
                        >
                          Export Rubric
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
        {viewRubricOpen && selectedRubricIndex != null && (
          <ViewRubricDialog
            open={viewRubricOpen}
            onOpenChange={setViewRubricOpen}
            initialRubric={sortedRubrics[selectedRubricIndex]}
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {rubrics.length} of {sortedRubrics.length} rubrics
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
          {totalPages > 0 && (
            <>
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

                {totalPages > 5 && page < totalPages - 2 && (
                  <span className="mx-1">...</span>
                )}

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
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </>
          )}
        </div>
      </div>
      {exportRubricOpen && selectedRubricIndex != null && (
        <ExportDialog
          open={exportRubricOpen}
          onOpenChange={setExportRubricOpen}
          exporterClass={RubricExporter}
          args={[sortedRubrics[selectedRubricIndex]]}
        />
      )}
    </div>
  );
}
