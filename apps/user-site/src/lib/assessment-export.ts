import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";
import { Assessment } from "@/types/assessment";

export class AssessmentExporter {
  constructor(private assessment: Assessment) {}

  // Lấy fileRef cho mỗi criterion từ scoreBreakdowns (ưu tiên fileRef từ feedbacks nếu có)
  private getFileRefsByCriterion() {
    const map = new Map<string, Set<string>>();
    // Duyệt qua scoreBreakdowns để lấy criterionName-tag
    this.assessment.scoreBreakdowns.forEach((sb) => {
      const key = `${sb.criterionName}-${sb.tag}`;
      // Tìm tất cả feedbacks có criterion trùng với breakdown (tag có thể khác hoa/thường)
      // SỬA: so sánh tag theo rubric (tag trong breakdown là tag rubric, tag trong feedback là tag feedback)
      // Nếu tag rubric là "Excellent", "Good", "Fair", "Poor" thì feedback.tag có thể là "info", "notice", "tip", "caution"
      // => Chỉ so sánh criterion, lấy tất cả fileRef của feedbacks cùng criterion (nếu muốn lấy hết file liên quan)
      // Nếu muốn chính xác hơn, cần map rubric tag với feedback tag (nếu có quy ước)
      const feedbackRefs = this.assessment.feedbacks
        .filter(
          (fb) =>
            (fb.criterion?.trim() || "") === (sb.criterionName?.trim() || "") &&
            fb.fileRef &&
            fb.fileRef !== "-",
        )
        .map((fb) => fb.fileRef);
      if (!map.has(key)) map.set(key, new Set());
      feedbackRefs.forEach((ref) => map.get(key)!.add(ref));
    });
    return map;
  }

  exportToPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Assessment Export`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Submission Reference: ${this.assessment.submissionReference}`, 14, 30);
    doc.text(`Total Score: ${this.assessment.rawScore}`, 14, 38);
    doc.text(`Adjusted Count: ${this.assessment.adjustedCount ?? 0}`, 14, 46);

    const fileRefMap = this.getFileRefsByCriterion();

    const body = this.assessment.scoreBreakdowns.map((sb) => {
      const key = `${sb.criterionName}-${sb.tag}`;
      const files = fileRefMap.get(key);
      // LOG để kiểm tra mapping thực tế
      console.log(
        "DEBUG: key",
        key,
        "files",
        files,
        "all feedbacks",
        this.assessment.feedbacks,
      );
      return [
        sb.criterionName,
        sb.tag,
        sb.rawScore.toString(),
        files && files.size > 0 ? [...files].join(", ") : "-",
      ];
    });

    // Table
    const head = [["Criterion", "Tag", "Score", "File(s)"]];

    autoTable(doc, {
      startY: 60,
      head,
      body,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Assessment_${this.assessment.submissionReference}.pdf`);
  }

  exportToExcel() {
    const fileRefMap = this.getFileRefsByCriterion();

    const worksheetData = [
      ["Assessment Export"],
      [`Submission Reference: ${this.assessment.submissionReference}`],
      [`Total Score: ${this.assessment.rawScore}`],
      [`Adjusted Count: ${this.assessment.adjustedCount ?? 0}`],
      [],
      ["Criterion", "Tag", "Score", "File(s)"],
      ...this.assessment.scoreBreakdowns.map((sb) => {
        const key = `${sb.criterionName}-${sb.tag}`;
        const files = fileRefMap.get(key);
        return [
          sb.criterionName,
          sb.tag,
          sb.rawScore,
          files && files.size > 0 ? [...files].join(", ") : "-",
        ];
      }),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assessment");

    const fileName = `Assessment_${this.assessment.submissionReference}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
