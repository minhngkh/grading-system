using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssignmentFlow.Application.Migrations
{
    /// <inheritdoc />
    public partial class AddGradingName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Gradings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "Gradings");
        }
    }
}
