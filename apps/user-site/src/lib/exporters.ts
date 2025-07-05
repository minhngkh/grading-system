import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Rubric } from "@/types/rubric"; // adjust path
import { utils as XLSXUtils, writeFile as XLSXWriteFile, WorkSheet } from "xlsx-js-style";
import { GradingAttempt } from "@/types/grading";
import { Assessment } from "@/types/assessment";
import GradingResultHelper from "@/lib/grading-result";

export interface DataExporter {
  exportToPDF(): void;
  exportToExcel(): void;
}

export class RubricExporter implements DataExporter {
  constructor(private rubric: Rubric) {
    // Initialize any properties if needed
  }

  exportToPDF() {
    const doc = new jsPDF({
      orientation: this.rubric.tags.length > 3 ? "landscape" : "portrait",
    });

    // Header
    doc.setFontSize(16);
    doc.text(`Rubric: ${this.rubric.rubricName}`, 14, 20);
    doc.setFontSize(10);

    // Build table head
    const allTags = this.rubric.tags;
    const head = [["Criterion (Weight)", ...allTags]];

    // Build table body
    const body = this.rubric.criteria.map((criterion) => {
      const criterionLabel = `${criterion.name} (${criterion.weight ?? 0}%)`;
      const row: string[] = [criterionLabel];
      for (const tag of allTags) {
        const level = criterion.levels.find((l) => l.tag === tag);
        row.push(level ? `${level.description} (${level.weight}%)` : "");
      }
      return row;
    });

    // Calculate the available width for the table (accounting for margins)
    const pageWidth = doc.internal.pageSize.width;
    const tableWidth = pageWidth - 28; // 14pt margin on each side
    const columnCount = allTags.length + 1; // Criteria column + tag columns
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

    doc.save(`${this.rubric.rubricName.replace(/\s+/g, "_")}_Rubric.pdf`);
  }

  exportToExcel() {
    // Prepare worksheet data
    const allTags = this.rubric.tags;

    // Create header row
    const headerRow = ["Criterion (Weight)", ...allTags];

    // Create data rows
    const dataRows = this.rubric.criteria.map((criterion) => {
      const criterionLabel = `${criterion.name} (${criterion.weight ?? 0}%)`;
      const row = [criterionLabel];

      for (const tag of allTags) {
        const level = criterion.levels.find((l) => l.tag === tag);
        row.push(level ? `${level.description} (${level.weight}%)` : "");
      }

      return row;
    });

    // Combine header and data for the worksheet
    const worksheetData = [headerRow, ...dataRows];

    // Create worksheet
    const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);

    // Define border style for all cells
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    // Header fill color (light gray)
    const headerFill = {
      fgColor: { rgb: "D9D9D9" },
    };

    // Apply styles: wrapText, vertical alignment, border, header fill + bold font for first row
    const range = XLSXUtils.decode_range(worksheet["!ref"]!);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSXUtils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell) {
          cell.s = {
            alignment: {
              wrapText: true,
              vertical: C === 0 ? "center" : "top",
              horizontal: R === 0 ? "center" : undefined, // center header text horizontally
            },
            border: borderStyle,
            fill: R === 0 ? headerFill : undefined,
            font: R === 0 ? { bold: true } : undefined,
          };
        }
      }
    }

    // Set column widths
    worksheet["!cols"] = worksheetData[0].map((_, i) =>
      i === 0 ? { wch: 40 } : { wch: 35 },
    );

    // Create workbook and add the worksheet
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, "Rubric");

    // Write to file and save
    const fileName = `${this.rubric.rubricName.replace(/\s+/g, "_")}_Rubric.xlsx`;
    XLSXWriteFile(workbook, fileName);
  }
}

export class GradingExporter implements DataExporter {
  constructor(
    private grading: GradingAttempt,
    private assessments: Assessment[],
  ) {
    // Initialize any properties if needed

    this.gradingHelper = new GradingResultHelper(
      this.assessments,
      this.grading.scaleFactor ?? 10,
    );
  }

  private gradingHelper: GradingResultHelper;

  exportToPDF() {
    const doc = new jsPDF();
    const scaleFactor = this.grading.scaleFactor ?? 10;

    // Header
    doc.setFontSize(16);
    doc.text(`Grading Report: ${this.grading.name}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Grade Scale: ${scaleFactor}`, 14, 35);

    // Grading info section
    doc.text(`Average Score: ${this.gradingHelper.getAverageScore().toFixed(2)}`, 14, 45);
    doc.text(`Lowest Score: ${this.gradingHelper.getLowestScore().toFixed(2)}`, 14, 50);
    doc.text(`Highest Score: ${this.gradingHelper.getHighestScore().toFixed(2)}`, 14, 55);

    // Add last updated time
    const lastUpdated =
      this.grading.lastModified ?
        this.grading.lastModified.toLocaleString()
      : "Not available";
    doc.text(`Last Updated: ${lastUpdated}`, 14, 60);

    // Selectors section
    doc.setFontSize(14);
    doc.text("Selectors:", 14, 75);
    doc.setFontSize(10);

    let yPosition = 85;
    this.grading.selectors.forEach((selector, index) => {
      doc.text(`${index + 1}. Criterion: ${selector.criterion}`, 14, yPosition);
      doc.text(`   Filter: ${selector.pattern}`, 14, yPosition + 8);
      yPosition += 20;
    });

    // Assessments table
    yPosition += 10;
    doc.setFontSize(14);
    doc.text("Assessment Results:", 14, yPosition);

    const tableHead = [["Submission Reference", "Total Grade"]];
    const tableBody = this.assessments.map((assessment) => {
      const totalRawScore = assessment.scoreBreakdowns.reduce(
        (sum, breakdown) => sum + breakdown.rawScore,
        0,
      );
      const totalGrade = (totalRawScore * scaleFactor) / 100;
      return [assessment.submissionReference, totalGrade.toFixed(2)];
    });

    autoTable(doc, {
      startY: yPosition + 10,
      head: tableHead,
      body: tableBody,
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineWidth: 0.1,
        lineColor: [80, 80, 80],
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      margin: { left: 14, right: 14 },
    });

    // Generate filename with grading name and updated time
    const updatedTime =
      this.grading.lastModified ?
        this.grading.lastModified.toISOString().slice(0, 16).replace(/[T:]/g, "_")
      : new Date().toISOString().slice(0, 16).replace(/[T:]/g, "_");

    const fileName = `Grading_${this.grading.name.replace(/\s+/g, "_")}_${updatedTime}.pdf`;
    doc.save(fileName);
  }

  exportToExcel() {
    const scaleFactor = this.grading.scaleFactor ?? 10;

    // Create grading info worksheet data
    const lastUpdated =
      this.grading.lastModified ?
        this.grading.lastModified.toLocaleString()
      : "Not available";

    const gradingInfoData = [
      ["Grading Name", this.grading.name],
      ["Grade Scale", `${scaleFactor}`],
      ["Last Updated", lastUpdated],
      ["Average Score", this.gradingHelper.getAverageScore().toFixed(2)],
      ["Lowest Score", this.gradingHelper.getLowestScore().toFixed(2)],
      ["Highest Score", this.gradingHelper.getHighestScore().toFixed(2)],
      [""],
      ["Selectors:"],
      ["Criterion", "Pattern"],
      ...this.grading.selectors.map((selector) => [selector.criterion, selector.pattern]),
    ];

    const gradingInfoSheet = XLSXUtils.aoa_to_sheet(gradingInfoData);

    // Create assessments summary table
    // First, get all unique criteria names from all assessments
    const allCriteria = Array.from(
      new Set(
        this.assessments.flatMap((assessment) =>
          assessment.scoreBreakdowns.map((sb) => sb.criterionName),
        ),
      ),
    ).sort();

    // Create header row
    const assessmentsHeader = [
      "Assessment Name",
      ...allCriteria.map((criterion) => `${criterion} Points`),
      "Total Points",
      "Comments",
    ];

    // Create data rows
    const assessmentsData = this.assessments.map((assessment) => {
      const row: any[] = [assessment.submissionReference];

      // Add points for each criterion (apply scale factor)
      allCriteria.forEach((criterion) => {
        const breakdown = assessment.scoreBreakdowns.find(
          (sb) => sb.criterionName === criterion,
        );
        const scaledScore = breakdown ? (breakdown.rawScore * scaleFactor) / 100 : 0;
        row.push(scaledScore.toFixed(2));
      });

      // Calculate total points (apply scale factor)
      const totalRawScore = assessment.scoreBreakdowns.reduce(
        (sum, breakdown) => sum + breakdown.rawScore,
        0,
      );
      const totalScaledPoints = (totalRawScore * scaleFactor) / 100;
      row.push(totalScaledPoints.toFixed(2));

      // Concatenate all comments with newlines
      const allComments = assessment.feedbacks
        .map((feedback) => feedback.comment)
        .filter((comment) => comment.trim() !== "")
        .join("\n");
      row.push(allComments);

      return row;
    });

    const assessmentsWorksheetData = [assessmentsHeader, ...assessmentsData];
    const assessmentsSheet = XLSXUtils.aoa_to_sheet(assessmentsWorksheetData);

    // Border style for cells
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    // Fill style for header background color (light gray)
    const headerFill = {
      fgColor: { rgb: "D9D9D9" },
    };

    // Helper function to style a sheet with borders, wrapping, vertical alignment, and header fill
    function styleSheet(sheet: WorkSheet, headerRows: number = 1) {
      const range = XLSXUtils.decode_range(sheet["!ref"]!);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSXUtils.encode_cell({ r: R, c: C });
          const cell = sheet[cellAddress];
          if (cell) {
            cell.s = {
              alignment: {
                wrapText: true,
                vertical: C === 0 ? "center" : "top",
              },
              border: borderStyle,
              fill: R < headerRows ? headerFill : undefined,
            };
          }
        }
      }
    }

    // Apply borders and wrap to entire gradingInfoSheet
    styleSheet(gradingInfoSheet, 0); // 0 header rows for default fill none

    // Manually set header fill for gradingInfoSheet on the "Criterion", "Pattern" row (row 8 zero-based)
    const headerRowIndex = 8;
    const rangeGrading = XLSXUtils.decode_range(gradingInfoSheet["!ref"]!);
    for (let C = rangeGrading.s.c; C <= rangeGrading.e.c; ++C) {
      const cellAddress = XLSXUtils.encode_cell({ r: headerRowIndex, c: C });
      const cell = gradingInfoSheet[cellAddress];
      if (cell) {
        cell.s = {
          ...(cell.s ?? {}),
          fill: headerFill,
          border: borderStyle,
          alignment: {
            wrapText: true,
            vertical: C === 0 ? "center" : "top",
            horizontal: "center",
          },
          font: { bold: true },
        };
      }
    }

    // Apply styling to assessments sheet with header row
    styleSheet(assessmentsSheet, 1); // Header row styling

    // Apply bold formatting to the total points column
    const assessmentsRange = XLSXUtils.decode_range(assessmentsSheet["!ref"]!);
    const totalPointsColumnIndex = allCriteria.length + 1; // Assessment name + criteria columns = total points column

    for (let R = assessmentsRange.s.r; R <= assessmentsRange.e.r; ++R) {
      const cellAddress = XLSXUtils.encode_cell({ r: R, c: totalPointsColumnIndex });
      const cell = assessmentsSheet[cellAddress];
      if (cell) {
        let cellFill = R === 0 ? headerFill : undefined;

        // Apply color coding for data rows (not header)
        if (R > 0 && cell.v !== undefined) {
          const totalPoints = parseFloat(cell.v.toString());
          const percentage = (totalPoints / scaleFactor) * 100;

          if (percentage < 20) {
            cellFill = { fgColor: { rgb: "FFCCCC" } }; // Light red
          } else if (percentage < 80) {
            cellFill = { fgColor: { rgb: "FFFFCC" } }; // Light yellow
          } else {
            cellFill = { fgColor: { rgb: "CCE5FF" } }; // Light blue
          }
        }

        cell.s = {
          ...cell.s,
          font: { bold: true },
          fill: cellFill,
        };
      }
    }

    // Set column widths for assessments sheet
    const assessmentsCols = [];
    // Assessment name column
    assessmentsCols.push({ wch: 25 });
    // Criterion points columns (smaller width for numbers)
    allCriteria.forEach(() => assessmentsCols.push({ wch: 12 }));
    // Total points column
    assessmentsCols.push({ wch: 12 });
    // Comments column (wider for text)
    assessmentsCols.push({ wch: 50 });

    assessmentsSheet["!cols"] = assessmentsCols;

    // Set column widths for grading info sheet
    gradingInfoSheet["!cols"] = [{ wch: 20 }, { wch: 40 }];

    // Create workbook and add worksheets
    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, gradingInfoSheet, "Grading Info");
    XLSXUtils.book_append_sheet(workbook, assessmentsSheet, "Assessment Summary");

    // Write to file and save
    const updatedTime =
      this.grading.lastModified ?
        this.grading.lastModified.toISOString().slice(0, 16).replace(/[T:]/g, "_")
      : new Date().toISOString().slice(0, 16).replace(/[T:]/g, "_");

    const fileName = `Grading_${this.grading.name.replace(/\s+/g, "_")}_${updatedTime}.xlsx`;
    XLSXWriteFile(workbook, fileName);
  }
}

export class AssessmentExporter implements DataExporter {
  constructor(private assessment: Assessment) {}

  exportToPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Assessment Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Submission: ${this.assessment.submissionReference}`, 14, 30);
    doc.text(`Total Score: ${this.assessment.rawScore}`, 14, 40);
    doc.text(`Adjusted Count: ${this.assessment.adjustedCount ?? 0}`, 14, 50);

    autoTable(doc, {
      startY: 60,
      head: [["Criterion", "Tag", "Score"]],
      body: this.assessment.scoreBreakdowns.map((sb) => [
        sb.criterionName,
        sb.performanceTag,
        sb.rawScore.toString(),
      ]),
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    //
    const yAfter = (doc as any).lastAutoTable?.finalY ?? 60;

    autoTable(doc, {
      startY: yAfter + 10,
      head: [["Criterion", "Comment", "Tag", "File", "Lines", "Cols"]],
      body: this.assessment.feedbacks.map((fb) => [
        fb.criterion,
        fb.comment,
        fb.tag,
        fb.fileRef.split("/").pop() ?? "",
        `${fb.fromLine ?? "-"}–${fb.toLine ?? "-"}`,
        `${fb.fromCol ?? "-"}–${fb.toCol ?? "-"}`,
      ]),
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Assessment_${this.assessment.submissionReference}.pdf`);
  }

  exportToExcel() {
    const wsData: any[][] = [];

    wsData.push(["Assessment Report"]);
    wsData.push(["Submission", this.assessment.submissionReference]);
    wsData.push(["Total Score", this.assessment.rawScore]);
    wsData.push(["Adjusted Count", this.assessment.adjustedCount ?? 0]);
    wsData.push([]);

    const scoreHeaderRow = wsData.length;
    wsData.push(["Criterion", "Tag", "Score"]);
    this.assessment.scoreBreakdowns.forEach((sb) =>
      wsData.push([sb.criterionName, sb.performanceTag, sb.rawScore]),
    );
    wsData.push([]);

    const feedbackHeaderRow = wsData.length;
    wsData.push(["Criterion", "Comment", "Tag", "File", "Line", "Col"]);

    this.assessment.feedbacks.forEach((fb) =>
      wsData.push([
        fb.criterion,
        fb.comment,
        fb.tag,
        fb.fileRef.split("/").pop() ?? "",
        `${fb.fromLine ?? "-"}–${fb.toLine ?? "-"}`,
        `${fb.fromCol ?? "-"}–${fb.toCol ?? "-"}`,
      ]),
    );

    const ws = XLSXUtils.aoa_to_sheet(wsData);

    const headerRows = [scoreHeaderRow, feedbackHeaderRow];
    headerRows.forEach((rowIdx) => {
      const colLen = wsData[rowIdx].length;
      for (let c = 0; c < colLen; c++) {
        const cellAddr = XLSXUtils.encode_cell({ r: rowIdx, c });
        const cell = ws[cellAddr];
        if (cell) {
          cell.s = {
            font: { bold: true, color: { rgb: "0000000" } },
            fill: { fgColor: { rgb: "D9D9D9" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: { rgb: "FFAAAAAA" } },
              bottom: { style: "thin", color: { rgb: "FFAAAAAA" } },
              left: { style: "thin", color: { rgb: "FFAAAAAA" } },
              right: { style: "thin", color: { rgb: "FFAAAAAA" } },
            },
          };
        }
      }
    });

    for (let r = 0; r < wsData.length; r++) {
      for (let c = 0; c < wsData[r].length; c++) {
        const cellAddr = XLSXUtils.encode_cell({ r, c });
        const cell = ws[cellAddr];
        if (cell) {
          cell.s = {
            ...cell.s,
            alignment: { ...cell.s?.alignment, wrapText: true, vertical: "top" },
            border: {
              top: { style: "thin", color: { rgb: "FFD9D9D9" } },
              bottom: { style: "thin", color: { rgb: "FFD9D9D9" } },
              left: { style: "thin", color: { rgb: "FFD9D9D9" } },
              right: { style: "thin", color: { rgb: "FFD9D9D9" } },
            },
          };
        }
      }
    }

    const maxCol = Math.max(...wsData.map((row) => row.length));
    const cols = [];
    for (let c = 0; c < maxCol; c++) {
      const maxLen = wsData.reduce((max, row) => {
        const cell = String(row[c] ?? "");
        return Math.max(max, cell.length);
      }, 0);
      cols.push({ wch: Math.min(maxLen + 5, 50) });
    }
    ws["!cols"] = cols;

    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, "Assessment");

    XLSXWriteFile(wb, `Assessment_${this.assessment.submissionReference}.xlsx`);
  }
}
