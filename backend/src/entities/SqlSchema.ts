import { Entity, ObjectIdColumn, Column } from 'typeorm';

export class SqlSchemaColumn {
  @Column()
  name: string;
  @Column()
  type: string;
  @Column({ nullable: true })
  maxLength?: number;
  @Column({ nullable: true })
  nullable?: boolean;
  @Column({ nullable: true })
  primaryKey?: boolean;
  @Column({ nullable: true })
  defaultValue?: any;
  @Column({ nullable: true })
  foreignKey?: string;
}

export class SqlSchemaRelationship {
  @Column()
  foreignKey: string;
  @Column()
  targetKey: string;
  @Column()
  targetTable: string;
  @Column()
  type: string;
}

export class SqlSchemaTable {
  @Column()
  name: string;
  @Column((type) => SqlSchemaColumn)
  columns: SqlSchemaColumn[];
  @Column((type) => SqlSchemaRelationship)
  relationships?: SqlSchemaRelationship[];
}

@Entity('sql_schema')
export class SqlSchema {
  @ObjectIdColumn()
  _id: string;

  @Column()
  id: string;

  @Column()
  name: string;

  @Column((type) => SqlSchemaTable)
  tables: SqlSchemaTable[];

  @Column({ nullable: true })
  createdAt?: string;
}
