using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Username", "PasswordHash" },
                values: new object[,]
                {
                    { 1, "lawrence", "AQAAAAIAAYagAAAAEENwgl1UBKS3qqWQqCo9j/6UklsCCbg8GEqjQOaruhfy2oEgK5nKOuILl76qLN9G7A=="},
                    { 2,"travis", "AQAAAAIAAYagAAAAEPgRlqFjtssa4YtLrF7wiKGA9oAvF8we1KVMVU8bBNlXsEWEunOQZG6ru7hfziF9mQ==" },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(table: "Users", keyColumn: "Id", keyValues: new object[] { 1, 2 });
        }
    }
}
