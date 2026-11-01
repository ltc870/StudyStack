using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSubstacks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SubstackId",
                table: "Cards",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Substacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    StackId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Substacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Substacks_Stacks_StackId",
                        column: x => x.StackId,
                        principalTable: "Stacks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cards_SubstackId",
                table: "Cards",
                column: "SubstackId");

            migrationBuilder.CreateIndex(
                name: "IX_Substacks_StackId",
                table: "Substacks",
                column: "StackId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cards_Substacks_SubstackId",
                table: "Cards",
                column: "SubstackId",
                principalTable: "Substacks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cards_Substacks_SubstackId",
                table: "Cards");

            migrationBuilder.DropTable(
                name: "Substacks");

            migrationBuilder.DropIndex(
                name: "IX_Cards_SubstackId",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "SubstackId",
                table: "Cards");
        }
    }
}
