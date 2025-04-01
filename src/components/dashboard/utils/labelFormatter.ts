import { endOfWeek } from "date-fns";
import { Step } from "../types/common.js";
import { numToRuMonth, numToRuMonthInf } from "./numToRuMonth.js";

export const labelFormatter = (step: Step) => (label: string) => {
  const [day, month, year] = label.split(".");

  if (step === "week") {
    const start = label;
    const formattedDate = `${year}-${month}-${day}`; // rearrange to YYYY-MM-DD
    const date = new Date(formattedDate);
    const end = endOfWeek(date, { weekStartsOn: 1 }).toLocaleDateString("ru");

    return `${start} - ${end}`;
  }

  if (step === "year") return `${year} год`;

  if (step === "month")
    return `${numToRuMonthInf[+month as keyof typeof numToRuMonthInf]} ${year}`;

  return `${day} ${numToRuMonth[+month as keyof typeof numToRuMonth]} ${year}`;
};
