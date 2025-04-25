"use client";

import type { Rubric } from "@/types/rubric";
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
import { useState } from "react";
import RubricView from "./rubric-view";

type SortConfig = {
  key: "rubricName" | "updatedOn" | "status" | null;
  direction: "asc" | "desc";
};

interface RubricDataTableProps {
  rubrics: Rubric[];
}

export function RubricDataTable({ rubrics }: RubricDataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "updatedOn",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Filter data
  const filteredData = rubrics.filter((rubric) => {
    const matchesSearch = rubric.rubricName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rubric?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    // Handle undefined/null values first
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
    if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

    if (sortConfig.key === "updatedOn") {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return sortConfig.direction === "asc"
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }

    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

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

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const getStatusBadge = (status: Rubric["status"]) => {
    switch (status) {
      case "drafted":
        return <Badge variant="outline">Drafted</Badge>;
      case "used":
        return <Badge variant="secondary">Used</Badge>;
      default:
        return <Badge variant="destructive">None</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
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
              setCurrentPage(1);
            }}
            className="pl-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 w-9 p-0"
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
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="drafted">Drafted</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || statusFilter !== "all") && (
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        )}
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent aria-describedby={undefined} className="min-w-[80%]">
          <DialogHeader>
            <DialogTitle>{selectedRubric?.rubricName}</DialogTitle>
          </DialogHeader>
          {selectedRubric && <RubricView rubricData={selectedRubric} />}
        </DialogContent>
      </Dialog>

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
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No rubrics found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((rubric) => (
                <TableRow key={rubric.id}>
                  <TableCell className="font-semibold">{rubric.rubricName}</TableCell>
                  <TableCell>
                    {rubric.updatedOn
                      ? format(rubric.updatedOn, "MMM d, yyyy")
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
                            setSelectedRubric(rubric);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          View Rubric
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
            Showing {paginatedData.length > 0 ? startIndex + 1 : 0}-
            {Math.min(startIndex + rowsPerPage, filteredData.length)} of{" "}
            {filteredData.length} rubrics
          </p>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              setRowsPerPage(Number.parseInt(value));
              setCurrentPage(1);
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
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;

              // Adjust page numbers for larger datasets
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
                  onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
