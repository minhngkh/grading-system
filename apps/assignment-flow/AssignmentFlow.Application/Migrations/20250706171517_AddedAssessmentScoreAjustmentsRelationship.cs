using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssignmentFlow.Application.Migrations
{
    /// <inheritdoc />
    public partial class AddedAssessmentScoreAjustmentsRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "AssessmentId",
                table: "ScoreAdjustments",
                type: "character varying(50)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_ScoreAdjustments_AssessmentId",
                table: "ScoreAdjustments",
                column: "AssessmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ScoreAdjustments_Assessments_AssessmentId",
                table: "ScoreAdjustments",
                column: "AssessmentId",
                principalTable: "Assessments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ScoreAdjustments_Assessments_AssessmentId",
                table: "ScoreAdjustments");

            migrationBuilder.DropIndex(
                name: "IX_ScoreAdjustments_AssessmentId",
                table: "ScoreAdjustments");

            migrationBuilder.AlterColumn<string>(
                name: "AssessmentId",
                table: "ScoreAdjustments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldNullable: true);
        }
    }
}
