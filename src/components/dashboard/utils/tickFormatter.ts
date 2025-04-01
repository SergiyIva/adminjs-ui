import { Step } from "../types/common.js";

export const tickFormatter = (step: Step) => (value: string) => {
  const [day, month, year] = value.split(".");
  if (step === "year") {
    return `${year}`;
  }
  if (step === "month") {
    return `${month}.${year}`;
  }
  return `${day}.${month}`;
};
