import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Rubric } from "@/types/rubric"; // adjust path
import * as XLSX from "xlsx-js-style";
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
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

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
    const range = XLSX.utils.decode_range(worksheet["!ref"]!);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
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
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rubric");

    // Write to file and save
    const fileName = `${this.rubric.rubricName.replace(/\s+/g, "_")}_Rubric.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
    doc.text(`Grading Report: ${this.grading.id}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Grade Scale: ${scaleFactor}`, 14, 35);

    // Grading info section
    doc.text(`Average Score: ${this.gradingHelper.getAverageScore().toFixed(2)}`, 14, 45);
    doc.text(`Lowest Score: ${this.gradingHelper.getLowestScore().toFixed(2)}`, 14, 50);
    doc.text(`Highest Score: ${this.gradingHelper.getHighestScore().toFixed(2)}`, 14, 55);

    // Selectors section
    doc.setFontSize(14);
    doc.text("Selectors:", 14, 70);
    doc.setFontSize(10);

    let yPosition = 80;
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

    doc.save(`Grading_Report_${this.grading.id.replace(/\s+/g, "_")}.pdf`);
  }

  exportToExcel() {
    const scaleFactor = this.grading.scaleFactor ?? 10;

    // Create grading info worksheet data
    const gradingInfoData = [
      ["Grading ID", this.grading.id],
      ["Grade Scale", scaleFactor],
      ["Average Score", this.gradingHelper.getAverageScore().toFixed(2)],
      ["Lowest Score", this.gradingHelper.getLowestScore().toFixed(2)],
      ["Highest Score", this.gradingHelper.getHighestScore().toFixed(2)],
      [""],
      ["Selectors:"],
      ["Criterion", "Pattern"],
      ...this.grading.selectors.map((selector) => [selector.criterion, selector.pattern]),
    ];

    const gradingInfoSheet = XLSX.utils.aoa_to_sheet(gradingInfoData);

    // Create assessments worksheet data
    const assessmentsHeader = ["Submission Reference", "Total Grade"];
    const assessmentsData = this.assessments.map((assessment) => {
      const totalRawScore = assessment.scoreBreakdowns.reduce(
        (sum, breakdown) => sum + breakdown.rawScore,
        0,
      );
      const totalGrade = (totalRawScore * scaleFactor) / 100;
      return [assessment.submissionReference, totalGrade];
    });

    const assessmentsWorksheetData = [assessmentsHeader, ...assessmentsData];
    const assessmentsSheet = XLSX.utils.aoa_to_sheet(assessmentsWorksheetData);

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
    function styleSheet(sheet: XLSX.WorkSheet, headerRows: number = 1) {
      const range = XLSX.utils.decode_range(sheet["!ref"]!);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
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

    // Manually set header fill for gradingInfoSheet on the "Criterion", "Pattern" row (row 7 zero-based)
    const headerRowIndex = 7;
    const rangeGrading = XLSX.utils.decode_range(gradingInfoSheet["!ref"]!);
    for (let C = rangeGrading.s.c; C <= rangeGrading.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
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

    // Apply styling and fill header row for assessmentsSheet (header row 0)
    styleSheet(assessmentsSheet, 1); // fill applied on first row

    // Set column widths
    gradingInfoSheet["!cols"] = [{ wch: 20 }, { wch: 40 }];
    assessmentsSheet["!cols"] = [{ wch: 30 }, { wch: 15 }];

    // Create workbook and add worksheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, gradingInfoSheet, "Grading Info");
    XLSX.utils.book_append_sheet(workbook, assessmentsSheet, "Assessments");

    // Write to file and save
    const fileName = `Grading_Report_${this.grading.id.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}

export class AssessmentExporter implements DataExporter {
  constructor(private assessment: Assessment) {}

  exportToPDF() {
    const doc = new jsPDF();

    // Thêm font Unicode (ví dụ DejaVuSans)
    // 1. Import font file đã convert sang js (xem hướng dẫn dưới)
    // 2. doc.addFileToVFS("DejaVuSans.ttf", ...); doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    // 3. doc.setFont("DejaVuSans");

    // Nếu bạn đã import font:
    // doc.addFileToVFS("DejaVuSans.ttf", DejaVuSansFontBase64);
    // doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    // doc.setFont("DejaVuSans");

    // Nếu chưa có font, bạn cần convert font .ttf sang js bằng công cụ: https://github.com/simonbengtsson/jsPDF-AutoTable#use-custom-fonts

    // Ví dụ:
    // import DejaVuSansFont from './fonts/DejaVuSans-normal.js';
    // doc.addFileToVFS("DejaVuSans.ttf", DejaVuSansFont);
    // doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    // doc.setFont("DejaVuSans");

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
      styles: { fontSize: 10, font: "DejaVuSans" }, // set font cho bảng
    });

    //
    const yAfter = (doc as any).lastAutoTable?.finalY ?? 60;

    autoTable(doc, {
      startY: yAfter + 10,
      head: [["Criterion", "Comment", "Tag", "File", "Position"]],
      body: this.assessment.feedbacks.map((fb) => {
        let position = "";
        if (fb.locationData?.type === "text") {
          position = `line: ${fb.locationData.fromLine ?? "-"}-${fb.locationData.toLine ?? "-"} col: ${fb.locationData.fromCol ?? "-"}-${fb.locationData.toCol ?? "-"}`;
        } else if (fb.locationData?.type === "pdf") {
          position = `page: ${fb.locationData.page ?? "-"}`;
        } // image: để trống
        return [
          fb.criterion,
          fb.comment,
          fb.tag,
          fb.fileRef.split("/").pop() ?? "",
          String(fb.locationData), // || position,
        ];
      }),
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      styles: { fontSize: 8, font: "DejaVuSans" }, // set font cho bảng
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
    wsData.push(["Criterion", "Tag", "Score", "Summary"]);
    this.assessment.scoreBreakdowns.forEach((sb) => {
      // Tìm summary feedback cho criterion này
      const summaryFb = this.assessment.feedbacks.find(
        (fb) => fb.tag === "summary" && fb.criterion === sb.criterionName,
      );
      wsData.push([
        sb.criterionName,
        sb.performanceTag,
        sb.rawScore,
        summaryFb ? summaryFb.comment : "",
      ]);
    });
    wsData.push([]);

    const feedbackHeaderRow = wsData.length;
    wsData.push(["Criterion", "Comment", "Tag", "File", "Position"]);

    this.assessment.feedbacks
      .filter((fb) => fb.tag !== "summary")
      .forEach((fb) => {
        let position = "";
        if (fb.locationData?.type === "text") {
          position = `line: ${fb.locationData.fromLine ?? "-"}-${fb.locationData.toLine ?? "-"} col: ${fb.locationData.fromCol ?? "-"}-${fb.locationData.toCol ?? "-"}`;
        } else if (fb.locationData?.type === "pdf") {
          position = `page: ${fb.locationData.page ?? "-"}`;
        }
        // image: để trống
        wsData.push([
          fb.criterion,
          fb.comment,
          fb.tag,
          fb.fileRef.split("/").pop() ?? "",
          fb.locationData ? JSON.stringify(fb.locationData) : position,
        ]);
      });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const headerRows = [scoreHeaderRow, feedbackHeaderRow];
    headerRows.forEach((rowIdx) => {
      const colLen = wsData[rowIdx].length;
      for (let c = 0; c < colLen; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c });
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
        const cellAddr = XLSX.utils.encode_cell({ r, c });
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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assessment");

    XLSX.writeFile(wb, `Assessment_${this.assessment.submissionReference}.xlsx`);
  }
}
