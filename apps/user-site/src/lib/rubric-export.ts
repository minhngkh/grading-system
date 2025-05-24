import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Rubric } from "@/types/rubric"; // adjust path
import * as XLSX from "xlsx";

export class RubricExporter {
  constructor(private rubric: Rubric) {
    // Initialize any properties if needed
  }

  exportToPDF() {
    const doc = new jsPDF({
      orientation: this.rubric.tags.length > 3 ? "landscape" : "portrait",
    });

    // Header
    doc.setFontSize(16);
    doc.text(`Rubric: ${this.rubric.name}`, 14, 20);
    doc.setFontSize(10);

    // Build table head
    const allTags = this.rubric.tags;
    const head = [["Criterion (Weight)", ...allTags, "Plugin"]];

    // Build table body
    const body = this.rubric.criteria.map((criterion) => {
      const criterionLabel = `${criterion.name} (${criterion.weight ?? 0}%)`;
      const row: string[] = [criterionLabel];
      for (const tag of allTags) {
        const level = criterion.levels.find((l) => l.tag === tag);
        row.push(level ? `${level.description} (${level.weight}%)` : "");
      }
      row.push(criterion.plugin ?? "AI");
      return row;
    });

    // Calculate the available width for the table (accounting for margins)
    const pageWidth = doc.internal.pageSize.width;
    const tableWidth = pageWidth - 28; // 14pt margin on each side
    const columnCount = allTags.length + 2; // Criteria column + tag columns + Plugin column
    const columnWidth = tableWidth / columnCount;

    // Generate table with evenly distributed columns
    autoTable(doc, {
      startY: 50,
      head,
      body,
      styles: {
        fontSize: 9,
        cellWidth: "auto",
        cellPadding: 3,
        lineWidth: 0.1, // Add thin gridlines
        lineColor: [80, 80, 80], // Dark gray grid lines
      },
      headStyles: {
        fillColor: [200, 200, 200], // Light gray background for header
        textColor: [0, 0, 0], // Black text for better contrast
        fontStyle: "bold",
      },
      bodyStyles: {
        fillColor: [255, 255, 255], // White background for body rows
      },
      columnStyles: {
        // Apply the same width to all columns
        ...Object.fromEntries(
          [...Array(columnCount).keys()].map((i) => [i, { cellWidth: columnWidth }]),
        ),
      },
      margin: { left: 14, right: 14 },
      tableLineWidth: 0.1, // Border around the whole table
      tableLineColor: [80, 80, 80], // Dark gray border
    });

    doc.save(`${this.rubric.name.replace(/\s+/g, "_")}_Rubric.pdf`);
  }

  exportToExcel() {
    // Prepare worksheet data
    const allTags = this.rubric.tags;

    // Create header row
    const headerRow = ["Criterion (Weight)", ...allTags, "Plugin"];

    // Create data rows
    const dataRows = this.rubric.criteria.map((criterion) => {
      const criterionLabel = `${criterion.name} (${criterion.weight ?? 0}%)`;
      const row = [criterionLabel];

      for (const tag of allTags) {
        const level = criterion.levels.find((l) => l.tag === tag);
        row.push(level ? `${level.description} (${level.weight}%)` : "");
      }
      row.push(criterion.plugin ?? "AI");

      return row;
    });

    // Combine header and data for the worksheet
    const worksheetData = [headerRow, ...dataRows];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = worksheetData[0].map((_, i) =>
      i === 0 ? { wch: 30 } : { wch: 25 },
    );
    worksheet["!cols"] = colWidths;

    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, this.rubric.name);

    // Write to file and save
    const fileName = `${this.rubric.name.replace(/\s+/g, "_")}_Rubric.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
