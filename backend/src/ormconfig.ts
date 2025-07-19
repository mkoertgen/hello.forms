import { DataSourceOptions } from 'typeorm';

const dbConfig: DataSourceOptions = {
  name: 'default',
  type: 'mongodb',
  host: 'localhost',
  port: 27017,
  database: 'forms',
  entities: [__dirname + '/entities/*.ts'],
  synchronize: true,
};

const sqliteConfig: DataSourceOptions = {
  name: 'sqlite',
  type: 'sqlite',
  database: '../data/forms.db',
  synchronize: false,
  entities: [__dirname + '/entities/*.ts'],
};

// Export both configurations for use in the application
// This allows you to switch between SQLite and MongoDB as needed
// Note that the order of export matters (first is default)
export default dbConfig;
