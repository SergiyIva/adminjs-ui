import { styled } from "@adminjs/design-system/styled-components";
import { Box, DatePicker, StyledSingleButton } from "@adminjs/design-system";
import React from "react";

type DateRangeProps = {
  dateFrom: Date
  dateTo: Date
  setDateFrom: (v: Date) => void
  setDateTo: (v: Date) => void
  onClick: () => void
  onReset: () => void
};
export const DateRange = ({ dateFrom, dateTo, setDateFrom, setDateTo, onClick, onReset }: DateRangeProps) => {
  return (
    <MyPickerBox flex justifyContent={"space-around"} mt={"sm"}>
      <DatePicker value={dateFrom} onChange={(v: string | null) => {
        if (!v) return;
        setDateFrom(new Date(v));
      }} propertyType={"date"} />
      <DatePicker value={dateTo} onChange={(v: string | null) => {
        if (!v) return;
        setDateTo(new Date(v));
      }} propertyType={"date"} />
      <Box flex>
        <StyledSingleButton hasLabel={false} mr={"md"} onClick={onClick}>Применить</StyledSingleButton>
        <StyledSingleButton hasLabel={false} onClick={onReset}>Сбросить</StyledSingleButton>
      </Box>
    </MyPickerBox>
  );
};

const MyPickerBox = styled(Box)`
    .react-datepicker__aria-live {
        display: none !important;
    }
`;
