import { useState, useMemo } from "react";
import { GradingAttempt, GradingStatus } from "@/types/grading";
import { GetGradingAttemptsResult } from "@/services/grading-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { SearchParams } from "@/types/searchParams";
import { useNavigate } from "@tanstack/react-router";

type SortConfig = {
  key: "id" | "rubricId" | "status" | "updatedOn" | null;
  direction: "asc" | "desc";
};

type ManageGradingAttemptsPageProps = {
  searchParams: SearchParams;
  results: GetGradingAttemptsResult;
  setSearchParam: (partial: Partial<SearchParams>) => void;
};

export default function ManageGradingAttemptsPage({
  searchParams,
  setSearchParam,
  results,
}: ManageGradingAttemptsPageProps) {
  const navigate = useNavigate();
  const handleView = (gradingId: string) => {
    navigate({ to: "/manage-assessments/$id", params: { id: gradingId } });
  };

  const [isLoading, setIsLoading] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "updatedOn",
    direction: "desc",
  });
  const { currentPage, rowsPerPage, searchTerm: searchTermProp = "" } = searchParams;
  const {
    data: gradingAttempts,
    meta: { total: totalCount },
  } = results;
  const [searchTerm, setSearchTerm] = useState<string>(searchTermProp);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAttempt, setSelectedAttempt] = useState<GradingAttempt | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Sync searchTerm with parent
  // (optional: debounce if muốn giống rubric)
  // useEffect(() => {
  //   setSearchParam({ searchTerm, currentPage: 1 });
  // }, [searchTerm]);

  // Filter and sort
  const filteredAttempts = useMemo(
    () =>
      statusFilter === "all"
        ? gradingAttempts
        : gradingAttempts.filter((a) => String(a.status) === statusFilter),
    [gradingAttempts, statusFilter],
  );

  const searchedAttempts = useMemo(
    () =>
      searchTerm
        ? filteredAttempts.filter(
            (a) =>
              a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (a.rubricId && a.rubricId.toLowerCase().includes(searchTerm.toLowerCase())),
          )
        : filteredAttempts,
    [filteredAttempts, searchTerm],
  );

  const sortedAttempts = useMemo(() => {
    if (!sortConfig.key) return searchedAttempts;
    return [...searchedAttempts].sort((a, b) => {
      const aKey = a[sortConfig.key as keyof GradingAttempt];
      const bKey = b[sortConfig.key as keyof GradingAttempt];
      if (aKey == null && bKey == null) return 0;
      if (aKey == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bKey == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (aKey < bKey) return sortConfig.direction === "asc" ? -1 : 1;
      if (aKey > bKey) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [searchedAttempts, sortConfig]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedAttempts.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(sortedAttempts.length / rowsPerPage);

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
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const getStatusBadge = (status?: GradingStatus) => {
    switch (status) {
      case GradingStatus.Created:
        return <Badge variant="default">Created</Badge>;
      case GradingStatus.Started:
        return <Badge variant="secondary">Started</Badge>;
      case GradingStatus.Graded:
        return <Badge variant="outline">Graded</Badge>;
      case GradingStatus.Completed:
        return <Badge variant="outline">Completed</Badge>;
      case GradingStatus.Failed:
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSearchParam({ searchTerm: "", currentPage: 1 });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Grading Attempts</h2>
        <p className="text-muted-foreground">Manage your grading attempts</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="grading_attempt_search"
            placeholder="Search grading attempts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchParam({ searchTerm: e.target.value, currentPage: 1 });
            }}
            className="pl-8"
          />
          {searchTerm.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent hover:text-red-600"
              onClick={() => {
                setSearchTerm("");
                setSearchParam({ searchTerm: "", currentPage: 1 });
              }}
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
            setSearchParam({ currentPage: 1 });
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value={String(GradingStatus.Created)}>Created</SelectItem>
            <SelectItem value={String(GradingStatus.Started)}>Started</SelectItem>
            <SelectItem value={String(GradingStatus.Graded)}>Graded</SelectItem>
            <SelectItem value={String(GradingStatus.Completed)}>Completed</SelectItem>
            <SelectItem value={String(GradingStatus.Failed)}>Failed</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter !== "all" && (
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        )}
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent aria-describedby={undefined} className="min-w-[60%]">
          <DialogHeader>
            <DialogTitle>Grading Attempt Details</DialogTitle>
          </DialogHeader>
          {selectedAttempt && (
            <div className="w-full h-full flex flex-col gap-2">
              <div>
                <strong>ID:</strong> {selectedAttempt.id}
              </div>
              <div>
                <strong>Status:</strong> {getStatusBadge(selectedAttempt.status)}
              </div>
              <div>
                <strong>Rubric ID:</strong> {selectedAttempt.rubricId || "N/A"}
              </div>
              {/* Add more fields if needed */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="w-full overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("id")} className="w-[25%]">
                <div className="flex items-center cursor-pointer">
                  Attempt ID {getSortIcon("id")}
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("rubricId")} className="w-[25%]">
                <div className="flex items-center cursor-pointer">
                  Rubric ID {getSortIcon("rubricId")}
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
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No grading attempts found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell className="font-semibold">{attempt.id}</TableCell>
                  <TableCell>{attempt.rubricId || "N/A"}</TableCell>
                  <TableCell>{getStatusBadge(attempt.status)}</TableCell>
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
                            handleView(attempt.id);
                            setSelectedAttempt(attempt);
                          }}
                        >
                          View Details
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
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {statusFilter === "all"
              ? `Showing ${gradingAttempts.length} of ${totalCount} grading attempts`
              : `Showing ${paginatedData.length} of ${sortedAttempts.length} grading attempts`}
          </p>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              setSearchParam({ rowsPerPage: Number.parseInt(value), currentPage: 1 });
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="10" />
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
            onClick={() => setSearchParam({ currentPage: Math.max(currentPage - 1, 1) })}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) return null;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setSearchParam({ currentPage: pageNum })}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="mx-1">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 1 && (
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="icon"
                className="w-8 h-8"
                onClick={() => setSearchParam({ currentPage: totalPages })}
              >
                {totalPages}
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSearchParam({ currentPage: Math.min(currentPage + 1, totalPages) })
            }
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
