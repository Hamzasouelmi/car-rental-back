/* eslint-disable max-classes-per-file */
import { Type, Expose as JsonProperty } from 'class-transformer';

export type Order = 'ASC' | 'DESC';
type DirectionType = Order | string;
export class Sort {
  public property: string;
  public direction: DirectionType;
  constructor(sort: string) {
    if (sort) {
      [this.property, this.direction] = sort.split(',');
    }
  }

  asOrder(): { [key: string]: DirectionType } {
    const order = {};
    order[this.property] = this.direction;
    return order;
  }
}

export class PageRequest {
  @JsonProperty()
  page = 0;
  @JsonProperty()
  size = 20;
  @Type(() => Sort)
  sort: Sort = new Sort('id,ASC');

  constructor(page: number | string, size: number | string, sort: string) {
    this.page = +page || this.page;
    this.size = +size || this.size;
    this.sort = sort ? new Sort(sort) : this.sort;
  }
}

export class Page<T> {
  constructor(
    public content: T[],
    public total: number,
    public pageable: PageRequest,
  ) {}
}
