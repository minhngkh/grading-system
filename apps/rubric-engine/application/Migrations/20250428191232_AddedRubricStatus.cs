using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RubricEngine.Application.Migrations
{
    /// <inheritdoc />
    public partial class AddedRubricStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Rubrics",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Rubrics");
        }
    }
}
