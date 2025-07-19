import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { JSONSchema7 } from 'json-schema';
import * as semver from 'semver';

export class FormMetadata {
  @Column()
  title: string;
  @Column()
  description: string;
  @Column()
  author: string;
  @Column()
  createdAt: Date;
  @Column()
  updatedAt: Date;
  @Column('array')
  private _tags: string[];

  get tags(): Set<string> {
    return new Set(this._tags);
  }
  set tags(value: Set<string>) {
    this._tags = Array.from(value);
  }
}

type SemanticVersion = string & { __semverBrand: true };

@Entity('form')
export class Form {
  @ObjectIdColumn()
  _id: string;

  @Column()
  id: string;

  @Column((type) => FormMetadata)
  meta: FormMetadata;

  @Column('json')
  schema: JSONSchema7;

  @Column({ name: 'version', nullable: true })
  private _version?: string;

  get version(): SemanticVersion | undefined {
    if (this._version && semver.valid(this._version)) {
      return this._version as SemanticVersion;
    }
    return undefined;
  }
  set version(value: string | undefined) {
    if (value && !semver.valid(value)) {
      throw new Error(`Invalid semantic version: ${value}`);
    }
    this._version = value;
  }
}
