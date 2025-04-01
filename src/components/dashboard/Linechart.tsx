import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StyledSingleButton } from "@adminjs/design-system";
import {
  Formatter,
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent.js";
import { styled } from "styled-components";

import { tickFormatter } from "./utils/tickFormatter.js";
import { labelFormatter } from "./utils/labelFormatter.js";
import { AggregationDataType, Step } from "./types/common.js";

type LineChartComponentProps = {
  data: AggregationDataType[];
  keys: string[];
  labels: string[];
  step: Step;
  withRelative?: boolean;
};

const colors = [
  "hsl(2,50%,50%)",
  "hsl(25,56%,50%)",
  "hsl(48,65%,49%)",
  "hsl(189,50%,50%)",
  "hsl(143,60%,65%)",
  "hsl(286,100%,50%)",
];

const getColors = (len: number) => {
  if (len > 3) {
    if (len > colors.length) {
      const step = Math.floor(360 / len);
      return [...Array(len)].map((_, i) => `hsl(${step * (i + 1)},50%,50%)`);
    }
    return colors;
  }
  return [colors[4], colors[1], colors[3]];
};

const StyledWrapper = styled.div`
  svg {
    overflow: visible;
  }

  .tooltip-wrapper {
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 1px 8px;
      max-width: 580px;
    }
  }

  .recharts-legend-wrapper {
    left: 0 !important;
  }
`;

const Wrapper = (
  props: PropsWithChildren<Record<string, unknown> & { length: number }>,
) =>
  props.length > 2 ? (
    <LineChart {...props}>{props.children}</LineChart>
  ) : (
    <AreaChart {...props}>{props.children}</AreaChart>
  );

export const LineChartComponent = ({
  data,
  keys,
  labels,
  step,
  withRelative,
}: LineChartComponentProps) => {
  const [selected, setSelected] = useState<number>();
  const [filter, setFilter] = useState<number[]>([]);
  const labelsData = useMemo(
    () =>
      data.map((item) => {
        const obj: { [key: string]: any } = {
          id: item.date,
        };
        keys.forEach((key, i) => {
          obj[labels[i]] = Number(item[key]);
        });

        return obj;
      }),
    [data],
  );

  const tooltipFormatter: Formatter<ValueType, NameType> = (
    value,
    name,
    item,
    index,
    payload,
  ) => {
    const id = item.payload.id;
    const sum = data.find((d) => d.date === id)!.sum;

    return sum > 0
      ? `${value} (${((+value / sum) * 100).toFixed(2)}%)`
      : "0 (0%)";
  };

  const palette = getColors(keys.length);

  const handleMouseEnter = (_: any, index: number) => {
    if (filter.includes(index)) return;
    setSelected(index);
  };

  const handleMouseLeave = () => {
    setSelected(undefined);
  };

  const memoLabelFormatter = useCallback(labelFormatter(step), [data]);
  const memoTickFormatter = useCallback(tickFormatter(step), [data]);

  return (
    <StyledWrapper>
      <ResponsiveContainer width="100%" height={keys.length > 20 ? 450 : 300}>
        <Wrapper
          length={keys.length}
          height={keys.length > 20 ? 450 : 300}
          data={labelsData}
          margin={{
            top: 20,
            right: 20,
            left: -30,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="6 6" stroke={"hsl(0, 0%, 20%)"} />
          <XAxis
            tick={{ fontSize: "12px" }}
            dataKey="id"
            interval={Math.floor(labelsData.length / 32)}
            tickFormatter={memoTickFormatter}
          />
          <YAxis scale={"auto"} tick={{ fontSize: "12px" }} type="number" />
          <Tooltip
            contentStyle={{ backgroundColor: "hsla(0, 0%, 10%, .7)" }}
            labelFormatter={memoLabelFormatter}
            formatter={(value, name, item, index, payload) =>
              withRelative
                ? tooltipFormatter(value, name, item, index, payload)
                : value
            }
            labelStyle={{
              textAlign: "center",
            }}
            wrapperClassName={
              keys.length - filter.length > 13 ? "tooltip-wrapper" : undefined
            }
            includeHidden={false}
            itemSorter={
              keys.length > 20
                ? (item) => {
                    return +(item.value ?? 0);
                  }
                : undefined
            }
          />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            onClick={(data, index, event) => {
              setFilter((f) =>
                f.includes(index)
                  ? f.filter((i) => i !== index)
                  : [...f, index],
              );
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          {labels.map((label, i) =>
            keys.length > 2 ? (
              <Line
                key={label + i}
                type={"monotone"}
                dataKey={label}
                strokeWidth={2}
                stroke={palette[i]}
                strokeOpacity={
                  typeof selected === "number" && selected !== i ? 0.2 : 1
                }
                hide={filter.includes(i)}
                onMouseEnter={() => handleMouseEnter(null, i)}
                onMouseLeave={handleMouseLeave}
              />
            ) : (
              <Area
                key={label + i}
                type={"monotone"}
                dataKey={label}
                strokeWidth={2}
                stroke={palette[i]}
                fill={palette[i]}
                fillOpacity={0.3}
              />
            ),
          )}
        </Wrapper>
      </ResponsiveContainer>
      {keys.length > 7 && (
        <StyledSingleButton
          color={"text"}
          onClick={() =>
            setFilter((f) =>
              f.length === keys.length
                ? []
                : [...Array(keys.length)].map((_, i) => i),
            )
          }
        >
          {filter.length === keys.length ? "Показать все" : "Скрыть все"}
        </StyledSingleButton>
      )}
    </StyledWrapper>
  );
};
