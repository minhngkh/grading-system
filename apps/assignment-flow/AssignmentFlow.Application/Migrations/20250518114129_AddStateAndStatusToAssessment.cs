using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssignmentFlow.Application.Migrations
{
    /// <inheritdoc />
    public partial class AddStateAndStatusToAssessment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastModified",
                table: "Assessments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Assessments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Assessments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastModified",
                table: "Assessments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Assessments");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Assessments");
        }
    }
}
