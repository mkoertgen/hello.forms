import { DataSource } from 'typeorm';
import { ObjectId } from 'mongodb';
import configArr from '../ormconfig';
import { Form } from '../src/entities/Form';
import { SqlSchema } from '../src/entities/SqlSchema';

// Use the default (MongoDB) config
const config = Array.isArray(configArr) ? configArr[0] : configArr;
const dataSource = new DataSource(config);

async function seed() {
  await dataSource.initialize();
  const formRepo = dataSource.getMongoRepository(Form);
  const schemaRepo = dataSource.getMongoRepository(SqlSchema);

  await formRepo.bulkWrite([
    {
      updateOne: {
        filter: { id: 'user-xy' },
        update: {
          $set: {
            id: 'user-xy',
            version: '0.0.1',
            meta: {
              title: 'User XY',
              description: 'User Template',
              author: 'User',
              createdAt: new Date('2025-07-19T09:56:12.834Z'),
              updatedAt: new Date('2025-07-19T12:55:04.123Z'),
              tags: ['user'],
            },
            schema: {
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  title: 'Email',
                  maxLength: 255,
                },
                first_name: {
                  type: 'string',
                  title: 'First name',
                  maxLength: 100,
                },
                last_name: {
                  type: 'string',
                  title: 'Last name',
                  maxLength: 100,
                },
                is_active: {
                  type: 'boolean',
                  title: 'Is active',
                },
              },
              required: ['email', 'first_name', 'last_name', 'is_active'],
            },
          },
        },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { id: 'product-ab' },
        update: {
          $set: {
            id: 'product-ab',
            version: '0.0.1',
            meta: {
              title: 'Product AB',
              description: 'Product Template',
              author: 'User',
              createdAt: new Date('2025-07-19T12:09:20.079Z'),
              updatedAt: new Date('2025-07-19T12:49:06.608Z'),
              tags: ['product'],
            },
            schema: {
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  title: 'Name',
                  maxLength: 200,
                },
              },
              required: ['name'],
            },
          },
        },
        upsert: true,
      },
    },
  ]);

  await schemaRepo.bulkWrite([
    {
      updateOne: {
        filter: { id: 'sample-schema' },
        update: {
          $set: {
            id: 'sample-schema',
            name: 'Sample E-commerce Schema',
            createdAt: '2025-07-19T12:49:06.608Z',
            tables: [
              {
                columns: [
                  {
                    name: 'id',
                    nullable: false,
                    primaryKey: true,
                    type: 'INTEGER',
                  },
                  {
                    maxLength: 255,
                    name: 'email',
                    nullable: false,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    maxLength: 100,
                    name: 'first_name',
                    nullable: false,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    maxLength: 100,
                    name: 'last_name',
                    nullable: false,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    maxLength: 20,
                    name: 'phone',
                    nullable: true,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    name: 'birth_date',
                    nullable: true,
                    primaryKey: false,
                    type: 'DATE',
                  },
                  {
                    defaultValue: true,
                    name: 'is_active',
                    nullable: false,
                    primaryKey: false,
                    type: 'BOOLEAN',
                  },
                  {
                    name: 'created_at',
                    nullable: false,
                    primaryKey: false,
                    type: 'TIMESTAMP',
                  },
                  {
                    name: 'updated_at',
                    nullable: false,
                    primaryKey: false,
                    type: 'TIMESTAMP',
                  },
                ],
                name: 'users',
              },
              {
                columns: [
                  {
                    name: 'id',
                    nullable: false,
                    primaryKey: true,
                    type: 'INTEGER',
                  },
                  {
                    foreignKey: 'users.id',
                    name: 'user_id',
                    nullable: false,
                    primaryKey: false,
                    type: 'INTEGER',
                  },
                  {
                    maxLength: 50,
                    name: 'order_number',
                    nullable: false,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    name: 'total_amount',
                    nullable: false,
                    primaryKey: false,
                    type: 'DECIMAL',
                  },
                  {
                    name: 'order_date',
                    nullable: false,
                    primaryKey: false,
                    type: 'DATETIME',
                  },
                  {
                    maxLength: 20,
                    name: 'status',
                    nullable: false,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    name: 'shipping_address',
                    nullable: true,
                    primaryKey: false,
                    type: 'TEXT',
                  },
                  {
                    name: 'notes',
                    nullable: true,
                    primaryKey: false,
                    type: 'TEXT',
                  },
                ],
                name: 'orders',
                relationships: [
                  {
                    foreignKey: 'user_id',
                    targetKey: 'id',
                    targetTable: 'users',
                    type: 'many-to-many',
                  },
                ],
              },
              {
                columns: [
                  {
                    name: 'id',
                    nullable: false,
                    primaryKey: true,
                    type: 'INTEGER',
                  },
                  {
                    maxLength: 200,
                    name: 'name',
                    nullable: false,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    name: 'description',
                    nullable: true,
                    primaryKey: false,
                    type: 'TEXT',
                  },
                  {
                    name: 'price',
                    nullable: false,
                    primaryKey: false,
                    type: 'DECIMAL',
                  },
                  {
                    maxLength: 100,
                    name: 'category',
                    nullable: false,
                    primaryKey: false,
                    type: 'VARCHAR',
                  },
                  {
                    defaultValue: true,
                    name: 'in_stock',
                    nullable: false,
                    primaryKey: false,
                    type: 'BOOLEAN',
                  },
                  {
                    name: 'weight',
                    nullable: true,
                    primaryKey: false,
                    type: 'FLOAT',
                  },
                  {
                    name: 'created_at',
                    nullable: false,
                    primaryKey: false,
                    type: 'TIMESTAMP',
                  },
                ],
                name: 'products',
              },
            ],
          },
        },
        upsert: true,
      },
    },
  ]);

  await dataSource.destroy();
  console.log('Seeding done!');
}

seed();
