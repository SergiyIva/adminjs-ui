import { Box, ButtonGroup } from "@adminjs/design-system";
import React from "react";
import { Step } from "./types/common.js";

type StepsProps = {
  step?: string;
  setStep: (step: Step) => void;
};
type StepObj = {
  id: Step;
  name: string;
};

const steps: StepObj[] = [
  {
    id: "day",
    name: "День",
  },
  {
    id: "week",
    name: "Неделя",
  },
  {
    id: "month",
    name: "Месяц",
  },
  {
    id: "year",
    name: "Год",
  },
];

export const Steps = ({ step, setStep }: StepsProps) => {
  const buttons = [
    {
      variant: "light" as const,
      label: step ? steps.find((s) => s.id === step)?.name : "Шаг",
      "data-testid": "actions-dropdown",
      buttons: steps.map((s) => ({
        label: s.name,
        onClick: () => setStep(s.id),
      })),
    },
  ];
  return (
    <Box pr={"md"}>
      <ButtonGroup buttons={buttons} />
    </Box>
  );
};
