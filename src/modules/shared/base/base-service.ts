import { BadRequestException } from '@nestjs/common';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class BaseService<T> {
  protected constructor(protected readonly repository: Repository<T>) {}

  async create(entity: T): Promise<T> {
    const isExist = await this.isExist(entity);
    if (isExist) {
      throw new BadRequestException('Record already exist');
    }

    return await this.repository.save(entity);
  }

  async isExist(conditions: Partial<T>): Promise<boolean> {
    const record = await this.repository.findOne({
      where: { ...conditions } as FindOptionsWhere<T>,
    });
    return !!record;
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    return this.repository.findOne(options);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async update(id: number, options: FindOneOptions<T>, entity: T): Promise<T> {
    await this.repository.update(id, entity as QueryDeepPartialEntity<T>);
    return this.findOne(options);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
