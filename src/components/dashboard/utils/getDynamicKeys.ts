import flatten from "lodash/flatten.js";

export const getDynamicKeys = (data: any[]) =>
  [...new Set(flatten(data.map((o) => Object.keys(o))))].filter(
    (k) => k !== "date",
  );
