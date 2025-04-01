export type Step = "day" | "week" | "month" | "year";
export type AggregationDataType = {
  [key: string]: number;
} & {
  sum: number;
  date: string;
};
