using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssignmentFlow.Application.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Assessments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TeacherId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GradingId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ScaleFactor = table.Column<decimal>(type: "numeric", nullable: false),
                    RawScore = table.Column<decimal>(type: "numeric", nullable: false),
                    AdjustedCount = table.Column<int>(type: "integer", nullable: false),
                    Feedbacks = table.Column<string>(type: "jsonb", nullable: true),
                    ScoreBreakdowns = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assessments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Gradings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TeacherId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RubricId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ScaleFactor = table.Column<decimal>(type: "numeric", nullable: false),
                    CriterionAttachmentsSelectors = table.Column<string>(type: "jsonb", nullable: true),
                    Submissions = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gradings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assessments");

            migrationBuilder.DropTable(
                name: "Gradings");
        }
    }
}
