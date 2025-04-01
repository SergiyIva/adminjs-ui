import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";
import type { AxiosResponse } from "axios";

import { AggregationDataType, Step } from "../types/common.js";

type UnionAggregDataType = AggregationDataType & {
  prevSum: number;
};

const appendDate = (date: Date, i: number, step: Step): Date => {
  switch (step) {
    case "day":
      return addDays(date, i);
    case "week":
      return addWeeks(date, i);
    case "month":
      return addMonths(date, i);
    case "year":
      return addYears(date, i);
    default:
      return date;
  }
};

const dateToStrByStep: {
  [key in Step]: (date: Date) => string;
} = {
  day: (date) => date.toLocaleDateString("ru"),
  week: (date) =>
    startOfWeek(date, { weekStartsOn: 1 }).toLocaleDateString("ru"),
  month: (date) => startOfMonth(date).toLocaleDateString("ru"),
  year: (date) => startOfYear(date).toLocaleDateString("ru"),
};

function generateDateRange(startDate: Date, endDate: Date, step: Step) {
  const dates: string[] = [];
  const dateFn = dateToStrByStep[step];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(dateFn(currentDate));
    currentDate = appendDate(currentDate, 1, step);
  }

  if (dates[dates.length - 1] < dateFn(endDate)) {
    dates.push(dateFn(endDate));
  }

  return dates;
}

const _getData = (
  data: {
    date: string;
    [key: string]: number | string;
  }[],
  period: number,
  step: Step,
  toDate: Date,
  fields: string[],
) => {
  const from = subDays(toDate, period);

  const datesWithData = data.map((item) => item.date);
  const allDates = generateDateRange(from, toDate, step); // Функция для генерации всех дат в диапазоне

  return allDates.map((date) => {
    const dataIndex = datesWithData.indexOf(date);
    let obj: {
      date: string;
      [key: string]: number | string;
    } = { date };
    for (const field of fields)
      obj[field] =
        dataIndex !== -1 && data[dataIndex][field] !== undefined
          ? data[dataIndex][field]
          : 0;

    return obj;
  });
};

export const getData = (
  data: {
    date: string;
    [key: string]: number | string;
  }[],
  period: number,
  step: Step,
  toDate: Date,
  fields: string[] = ["sum"],
) => {
  return _getData(data, period, step, toDate, fields);
};

export const getMockData = (
  period: number,
  step: Step,
  toDate: Date,
  fields: string[] = ["sum", "prevSum"],
) => {
  return _getData([], period, step, toDate, fields);
};

const getTotal = (data: (UnionAggregDataType | AggregationDataType)[]) =>
  data.map(({ sum }) => +sum).reduce((val, acc) => val + acc, 0);

export const prepareDataWithDelta = (
  data: [
    {
      date: string;
      [key: string]: number | string;
    }[],
    number,
  ],
  period: number,
  step: Step,
  toDate: Date,
  fields: string[] = ["sum"],
): [UnionAggregDataType[], string] => {
  const currData = getData(
    data[0],
    period,
    step,
    toDate,
    fields,
  ) as UnionAggregDataType[];

  if (data[1] === -1) return [currData, ""];

  const currTotal = getTotal(currData);
  const newDelta = getDelta(data[1], currTotal);

  return [currData, newDelta];
};

const getDelta = (prevTotal: number, currTotal: number) => {
  let newDelta = "";

  if (prevTotal > 0) {
    const percent = ((currTotal - prevTotal) * 100) / prevTotal;
    newDelta = `${percent > 0 ? "+" : "-"}${percent.toFixed(2)}%`;
  } else newDelta = `+${(currTotal * 100).toFixed(2)}%`;

  return newDelta;
};

export const prepareData = (
  response: AxiosResponse<AggregationDataType[][]>,
  period: number,
  step: Step,
  toDate = new Date(),
): [UnionAggregDataType[], string] => {
  const [curr, prev] = response.data;
  const prevData = prev.length
    ? prev
    : (getMockData(
        period,
        step,
        subDays(toDate, period),
      ) as UnionAggregDataType[]);
  const currData = curr.length
    ? (getData(curr, period, step, toDate) as UnionAggregDataType[])
    : (getMockData(period, step, toDate) as UnionAggregDataType[]);

  const prevTotal = getTotal(prevData);
  const currTotal = getTotal(currData);

  const newDelta = getDelta(prevTotal, currTotal);

  const unionData = currData.map((obj, i) => ({
    ...obj,
    prevSum: prevData[i] ? prevData[i].sum : 0,
  })) as UnionAggregDataType[];

  return [unionData, newDelta];
};
