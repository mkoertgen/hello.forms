import { Column, Entity } from "typeorm";

@Entity("sql_schema")
export class SqlSchema {
  @Column("text", { primary: true, name: "id", nullable: true, unique: true })
  id: string | null;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "tables_json" })
  tablesJson: string;

  @Column("datetime", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date | null;
}
