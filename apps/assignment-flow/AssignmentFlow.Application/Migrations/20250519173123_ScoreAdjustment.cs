using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssignmentFlow.Application.Migrations
{
    /// <inheritdoc />
    public partial class ScoreAdjustment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ScoreAdjustments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TeacherId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GradingId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AssessmentId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Score = table.Column<decimal>(type: "numeric", nullable: false),
                    DeltaScore = table.Column<decimal>(type: "numeric", nullable: false),
                    AdjustmentSource = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeltaScoreBreakdowns = table.Column<string>(type: "jsonb", nullable: true),
                    ScoreBreakdowns = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScoreAdjustments", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScoreAdjustments");
        }
    }
}
