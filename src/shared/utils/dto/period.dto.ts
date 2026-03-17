import { IsDateString } from 'class-validator';
import {
  differenceInMonths,
  endOfDay,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';

export class PeriodDTO {
  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  constructor(startDate, endDate) {
    this.startDate = startOfDay(
      new Date(typeof startDate === 'string' ? parseISO(startDate) : startDate),
    );
    this.endDate = endOfDay(
      new Date(typeof endDate === 'string' ? parseISO(endDate) : endDate),
    );
  }

  getTemporalBetweenStartAndEnd() {
    return;
  }

  isStrictlyBefore(period: PeriodDTO) {
    return isAfter(period.startDate, this.endDate);
  }

  includeDate(date: Date) {
    if (!date) return false;
    const convertedCurrentStartPeriod = startOfDay(this.startDate);
    const convertedCurrentEndPeriod = endOfDay(this.endDate);
    const convertedDateStartOfDay = startOfDay(date);
    const convertedDateEndOfDay = endOfDay(date);
    return (
      isEqual(convertedCurrentStartPeriod, convertedDateStartOfDay) ||
      (isAfter(convertedDateStartOfDay, convertedCurrentStartPeriod) &&
        isBefore(convertedDateEndOfDay, convertedCurrentEndPeriod)) ||
      isEqual(convertedDateEndOfDay, convertedCurrentEndPeriod)
    );
  }

  getMonthDifference() {
    return differenceInMonths(
      startOfMonth(this.endDate),
      startOfMonth(this.startDate),
    );
  }
}
