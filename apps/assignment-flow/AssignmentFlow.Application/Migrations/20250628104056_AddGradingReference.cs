using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssignmentFlow.Application.Migrations
{
    /// <inheritdoc />
    public partial class AddGradingReference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Reference",
                table: "Gradings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reference",
                table: "Gradings");
        }
    }
}
