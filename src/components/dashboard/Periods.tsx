import { ButtonGroup } from "@adminjs/design-system";
import React from "react";
import { periods } from "./constants/periods.js";

type PeriodsProps = {
  period: number;
  setPeriod: (period: number) => void;
};

export const Periods = ({ setPeriod, period }: PeriodsProps) => {
  const buttons = [
    {
      variant: "light" as const,
      label: period ? `${period} дней` : "Период",
      "data-testid": "actions-dropdown",
      buttons: periods.map((p) => ({
        label: `${p} дней`,
        onClick: () => setPeriod(p),
      })),
    },
  ];
  return <ButtonGroup buttons={buttons} />;
};
