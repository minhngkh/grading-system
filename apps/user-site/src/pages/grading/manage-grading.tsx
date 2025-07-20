import { useState } from "react";
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
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, X } from "lucide-react";
import { useDebounceUpdate } from "@/hooks/use-debounce";
import { GetAllResult, SearchParams } from "@/types/search-params";
import { GradingAttempt, GradingStatus } from "@/types/grading";
import { Link } from "@tanstack/react-router";
import { ExportDialog } from "@/components/app/export-dialog";
import { GradingExporter } from "@/lib/exporters";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getAllGradingAssessmentsQueryOptions } from "@/queries/assessment-queries";

type ManageGradingsPageProps = {
  searchParams: SearchParams;
  results: GetAllResult<GradingAttempt>;
  setSearchParam: (partial: Partial<SearchParams>) => void;
};

export default function ManageGradingsPage({
  searchParams,
  setSearchParam,
  results,
}: ManageGradingsPageProps) {
  const { page, perPage, status } = searchParams;
  const {
    data: gradings,
    meta: { total: totalCount },
  } = results;
  const auth = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.search ?? "");
  const [exportGradingOpen, setExportGradingOpen] = useState(false);
  const [selectGradingIndex, setSelectGradingIndex] = useState<number | null>(null);
  useDebounceUpdate(searchTerm, 500, (value) => {
    if (value === searchParams.search) return;
    setSearchParam({ search: value, page: 1 });
  });

  const gradingId = selectGradingIndex != null ? gradings[selectGradingIndex].id : "";

  const { data: gradingAssessments = [], isLoading: isGettingAssessments } = useQuery(
    getAllGradingAssessmentsQueryOptions(gradingId, auth, {
      enabled: exportGradingOpen && selectGradingIndex != null,
      staleTime: 5 * 60 * 1000,
    }),
  );

  const totalPages = Math.ceil(totalCount / perPage);

  const getStatusBadge = (status?: GradingStatus) => {
    if (!status) {
      return <Badge variant="destructive">None</Badge>;
    }

    const statusString = GradingStatus[status];
    switch (status) {
      case GradingStatus.Graded:
        return <Badge variant="default">{statusString}</Badge>;
      case GradingStatus.Created:
        return <Badge variant="secondary">{statusString}</Badge>;
      case GradingStatus.Started:
        return <Badge variant="outline">{statusString}</Badge>;
      case GradingStatus.Failed:
        return <Badge variant="destructive">{statusString}</Badge>;
      default:
        return <Badge variant="destructive">None</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchParam({ search: undefined, status: undefined, page: 1 });
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
          value={status ?? "All"}
          onValueChange={(value) => {
            setSearchParam({ status: value === "All" ? undefined : value, page: 1 });
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
        {status != undefined && (
          <Button onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="w-full overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Name</TableHead>
              <TableHead className="w-[20%]">Created At</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[20%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradings.length === 0 ?
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No gradings found.
                </TableCell>
              </TableRow>
            : gradings.map((grading, index) => (
                <TableRow key={index}>
                  <TableCell className="font-semibold">{grading.name}</TableCell>
                  <TableCell>
                    {grading.createdAt ?
                      format(grading.createdAt, "MMM d, yyyy")
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
                        {(
                          grading.status === GradingStatus.Graded ||
                          grading.status === GradingStatus.Failed
                        ) ?
                          <DropdownMenuItem asChild>
                            <Link
                              to="/gradings/$gradingId/result"
                              params={{ gradingId: grading.id }}
                            >
                              View Result
                            </Link>
                          </DropdownMenuItem>
                        : grading.status === GradingStatus.Started ?
                          <DropdownMenuItem asChild>
                            <Link
                              to="/gradings/$gradingId"
                              params={{ gradingId: grading.id }}
                            >
                              View Progress
                            </Link>
                          </DropdownMenuItem>
                        : <DropdownMenuItem asChild>
                            <Link
                              to="/gradings/$gradingId"
                              params={{ gradingId: grading.id }}
                            >
                              Resume Grading
                            </Link>
                          </DropdownMenuItem>
                        }
                        {grading.status === GradingStatus.Graded && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to="/analytics" search={{ id: grading.id }}>
                                View Analytics
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectGradingIndex(index);
                                setExportGradingOpen(true);
                              }}
                            >
                              Export Grading
                            </DropdownMenuItem>
                          </>
                        )}
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
            Showing {gradings.length} of {totalCount} gradings
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
      {exportGradingOpen && selectGradingIndex != null && (
        <ExportDialog
          open={exportGradingOpen}
          onOpenChange={setExportGradingOpen}
          exporterClass={GradingExporter}
          args={[gradings[selectGradingIndex], gradingAssessments]}
          isLoading={isGettingAssessments}
        />
      )}
    </div>
  );
}
