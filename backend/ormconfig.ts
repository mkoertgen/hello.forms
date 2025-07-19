import { DataSourceOptions } from 'typeorm';

const mongoConfig: DataSourceOptions = {
  name: 'mongodb',
  type: 'mongodb',
  host: 'localhost',
  port: 27017,
  database: 'forms',
  entities: [__dirname + '/src/entities/*.ts'],
  //migrations: [__dirname + '/src/migrations/*.ts'],
  synchronize: true,
};

const sqliteConfig: DataSourceOptions = {
  name: 'sqlite',
  type: 'sqlite',
  database: 'data/forms.db',
  synchronize: false,
  entities: [__dirname + '/src/entities/*.ts'],
};

// Export both configurations for use in the application
// This allows you to switch between SQLite and MongoDB as needed
// Note that the order of export matters (first is default)
export default [mongoConfig, sqliteConfig];
