import React, { FC, useEffect, useState } from "react";
import { differenceInDays, subDays } from "date-fns";
import { Box, Text } from "@adminjs/design-system";
import type { AxiosResponse } from "axios";

import { LineChartComponent } from "./Linechart.js";
import { Periods } from "./Periods.js";
import {
  getMockData,
  prepareData,
  prepareDataWithDelta,
} from "./utils/getDataForCharts.js";
import { DateRange } from "./DateRange.js";
import { Steps } from "./Steps.js";
import { dateToEpoch } from "./utils/dateToEpoch.js";
import { getDynamicKeys } from "./utils/getDynamicKeys.js";
import { periods } from "./constants/periods.js";
import { apiClient } from "../../api/client.js";
import { AggregationDataType, Step } from "./types/common.js";

type ParamValue<T> = {
  id: T;
  isLabel: boolean;
};
type Params = {
  step: ParamValue<Step>;
} & Record<string, ParamValue<string>>;
type ChartWrapperProps = {
  type: string;
  title: string;
  keys: string[];
  labels: string[];
  baseOptions?: {
    withRelative?: boolean;
    dynamicKeys?: boolean;
  };
  additionalOptions?: WithOption;
};
export type AdditionalComponentProps = {
  type?: string;
  setType: (type: string) => void;
};
type WithOption = {
  [key: string]: {
    component: FC<AdditionalComponentProps>;
    params?: { id: string; isLabel: boolean };
  };
};

const getParamsFromOptions = (options: WithOption) =>
  Object.keys(options).reduce(
    (acc, key) => {
      acc[key] = {
        id: options[key].params?.id ?? "all",
        isLabel: options[key].params?.isLabel ?? false,
      };
      return acc;
    },
    {} as Record<string, ParamValue<string>>,
  );

export const MultiChartWrapper: FC<ChartWrapperProps> = ({
  type,
  title,
  keys,
  labels,
  baseOptions = {},
  additionalOptions = {},
}) => {
  const { withRelative, dynamicKeys } = baseOptions;
  const initParams: Params = {
    step: {
      id: "day",
      isLabel: false,
    },
    ...getParamsFromOptions(additionalOptions),
  };
  const [period, setPeriod] = useState(30);
  const [params, setParams] = useState<Params>(initParams);
  const [dateFrom, setDateFrom] = useState(
    subDays(new Date(dateToEpoch(new Date())), period),
  );
  const [dateTo, setDateTo] = useState(new Date());
  const [data, setData] = useState<AggregationDataType[]>(
    getMockData(
      period,
      params.step.id,
      new Date(),
      keys,
    ) as AggregationDataType[],
  );
  const [delta, setDelta] = useState<string>();
  const [dKeys, setDKeys] = useState<string[] | undefined>();

  useEffect(() => {
    if (!period) return;
    setDateTo(new Date());
    setDateFrom(subDays(new Date(dateToEpoch(new Date())), period));
  }, [period]);

  useEffect(() => {
    const diff = differenceInDays(dateTo, dateFrom);
    if (!!period && periods.indexOf(diff) < 0) {
      setPeriod(0);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    onClick();
  }, [keys]);

  const onReset = () => {
    setPeriod(30);
    setParams(initParams);
  };

  const onClick = () => {
    if (dateFrom >= dateTo) return;

    apiClient
      .getDashboard({
        params: {
          from: dateFrom.toLocaleDateString("en"),
          to: dateTo.toLocaleDateString("en"),
          type,
          ...Object.keys(params).reduce(
            (acc, val) => ({ ...acc, [val]: params[val as keyof Params]!.id }),
            {},
          ),
        },
      })
      .then((response) => {
        const args = [
          differenceInDays(dateTo, dateFrom),
          params.step.id,
          dateTo,
        ] as const;
        const currentKeys = dynamicKeys
          ? getDynamicKeys(
              (response.data as [AggregationDataType[], number])[0],
            )
          : keys;
        const [data, delta] =
          keys.length === 2 && !dynamicKeys
            ? prepareData(
                response as AxiosResponse<AggregationDataType[][]>,
                ...args,
              )
            : prepareDataWithDelta(
                response.data as [AggregationDataType[], number],
                ...args,
                currentKeys,
              );
        if (dynamicKeys) {
          const keysForSet =
            keys.length !== labels.length
              ? currentKeys
                  .slice(1) // Убираем первый элемент
                  .concat(currentKeys[0]) // Добавляем первый элемент в конец
              : currentKeys;
          setDKeys(keysForSet);
        }
        setData(data as AggregationDataType[]);
        if (delta) setDelta(delta);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <Box variant={"container"} my={["xl"]} mx={["xs"]}>
      <Box flex justifyContent={"space-between"} p={"sm"}>
        <Box flex>
          <Text fontWeight="bold" textAlign="left" variant={"lg"}>
            {title}
          </Text>
          {delta && (
            <Text color={delta.startsWith("+") ? "green" : "red"} ml={"lg"}>
              {delta}
            </Text>
          )}
        </Box>
        <Box flex>
          {Object.keys(params)
            .filter((k) => k !== "step")
            .map((k) =>
              additionalOptions[k].component({
                type: params[k].isLabel ? params[k].id : undefined,
                setType: (type: string) =>
                  setParams({
                    ...params,
                    [k]: { id: type, isLabel: true },
                  }),
              }),
            )}
          <Steps
            step={params.step.isLabel ? params.step.id : undefined}
            setStep={(step: Step) =>
              setParams({ ...params, step: { id: step, isLabel: true } })
            }
          />
          <Periods setPeriod={setPeriod} period={period} />
        </Box>
      </Box>
      <DateRange
        dateTo={dateTo}
        dateFrom={dateFrom}
        setDateTo={setDateTo}
        setDateFrom={setDateFrom}
        onClick={onClick}
        onReset={onReset}
      />
      <LineChartComponent
        data={data}
        keys={dKeys || keys}
        labels={getLabels(keys, labels, dKeys)}
        withRelative={withRelative}
        step={params.step.id}
      />
    </Box>
  );
};

const getLabels = (keys: string[], labels: string[], dKeys?: string[]) => {
  if (!dKeys) return labels;
  if (keys.length !== labels.length) return dKeys.filter((k) => k !== "sum");
  return dKeys.map((k) => (k === "sum" && keys[0] === "sum" ? labels[0] : k));
};
