import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormGroup,
  FormMessage,
  Icon,
  Section,
  SelectAsync,
} from "@adminjs/design-system";
import {
  EditPropertyProps,
  flat,
  ParamsType,
  PropertyJSON,
  PropertyLabel,
  RecordError,
  RecordJSON,
  SelectRecord,
  useTranslation,
} from "adminjs";
import { styled } from "@adminjs/design-system/styled-components";
import { unflatten } from "flat";
import { getNextKey, parseObjectValue } from "./utils.js";
import { apiClient } from "../../api/client.js";

type EditKeyValuePairProps = {
  onKeyChange: (key: string, newKey: string) => void;
  onValueChange: (key: string, param: string, newValue: any) => void;
  onRemoveItem: (key: string) => void;
  objectValue: Record<string, any>;
  objectKey: string;
  property: PropertyJSON;
  Form: React.ComponentType<FormProps>;
  error?: RecordError;
};
export type FormProps = {
  objectValue: Record<string, any>;
  onValueChange: (param: string, newValue: any) => void;
  objectKey: string;
  property: PropertyJSON;
};
export type Relation = {
  modelRef: string;
  properties: string[];
};

export const MyForm = styled(FormGroup)`
  label {
    display: none;
  }

  section > div {
    margin-bottom: 0;
  }
`;

const EditKeyValuePair: React.FC<EditKeyValuePairProps> = (props) => {
  const {
    onKeyChange,
    onValueChange,
    onRemoveItem,
    property,
    objectValue,
    objectKey,
    Form,
    error,
  } = props;
  const [currentKey, setCurrentKey] = useState(objectKey ?? "");
  const [loadingRecord, setLoadingRecord] = useState(0);
  const [loadedRecord, setLoadedRecord] = useState<RecordJSON | undefined>();

  const loadOptions = async (inputValue: string): Promise<SelectRecord[]> => {
    const optionRecords = await apiClient.searchRecords({
      resourceId: property.reference!,
      query: inputValue,
    });
    return optionRecords.map((optionRecord: RecordJSON) => ({
      value: optionRecord.id,
      label: optionRecord.title,
      record: optionRecord,
    }));
  };

  const handleChange = (selected: SelectRecord) => {
    if (selected) {
      setCurrentKey(selected.value.toString());
      onKeyChange(currentKey, selected.value.toString());
    } else {
      setCurrentKey("");
      onKeyChange(currentKey, "");
    }
  };

  const handleValueChange = (param: string, newValue: any) => {
    onValueChange(currentKey, param, newValue);
  };

  useEffect(() => {
    if (currentKey) {
      setLoadingRecord((c) => c + 1);
      apiClient
        .recordAction({
          actionName: "show",
          resourceId: property.reference!,
          recordId: currentKey,
        })
        .then(({ data }: any) => {
          setLoadedRecord(data.record);
        })
        .finally(() => {
          setLoadingRecord((c) => c - 1);
        });
    }
  }, [currentKey, property]);

  const selectedValue = loadedRecord;
  const selectedOption =
    currentKey && selectedValue
      ? {
          value: selectedValue.id,
          label: selectedValue.title,
        }
      : {
          value: "",
          label: "",
        };

  return (
    <Box flex mb="lg">
      <Box flex justifyContent="space-between" flexGrow={1} flexShrink={0}>
        <MyForm error={Boolean(error)} mr="lg" mb="0px">
          <SelectAsync
            cacheOptions
            value={selectedOption}
            defaultOptions
            loadOptions={loadOptions}
            onChange={handleChange}
            isClearable
            isDisabled={property.isDisabled}
            isLoading={!!loadingRecord}
          />
          {error && <FormMessage>{error.message}</FormMessage>}
        </MyForm>
        <Form
          objectValue={objectValue}
          objectKey={objectKey}
          onValueChange={handleValueChange}
          property={property}
        />
      </Box>
      <Button
        rounded
        ml="sm"
        data-testid="delete-item"
        type="button"
        size="icon"
        onClick={() => onRemoveItem(currentKey)}
        variant="contained"
        color="danger"
        flexGrow={0}
        flexShrink={1}
      >
        <Icon icon="Trash2" />
      </Button>
    </Box>
  );
};

export const EditWithRelationTemplate: React.FC<
  EditPropertyProps & {
    Form: React.ComponentType<FormProps>;
    relation: Relation;
  }
> = (props) => {
  const { property, record, onChange, resource, Form, relation } = props;
  const { tm, tb } = useTranslation();
  const selectedValues = unflatten<ParamsType, any>(record.params)[property.path] || [];
  const selectedValuesToOptions = selectedValues
    .map((selectedValue: any) => {
      const params = record.populated[`${property.path}.${selectedValue}`]?.params;
      if (!params) return {};
      return {
        [params[relation.modelRef]]: {
          ...relation.properties.reduce(
            (object, prop) => ({
              ...object,
              [prop]: params[prop],
            }),
            {}
          ),
        },
      };
    })
    .reduce((acc: any, val: any) => ({ ...acc, ...val }), {});
  const [objectValue, setObjectValue] = useState<Record<string, any>>(
    selectedValuesToOptions ?? {}
  );

  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    if (newKey in objectValue) {
      handleRemoveItem(oldKey);
      return;
    }

    const tmpValue = objectValue[oldKey];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [oldKey]: _removedKey, ...objectCopy } = objectValue;

    objectCopy[newKey] = tmpValue ?? "";
    setObjectValue(parseObjectValue(objectCopy));
  };

  const handleValueChange = (key: string, param: string, value: unknown) => {
    objectValue[key] = {
      ...objectValue[key],
      [param]: value,
    };

    setObjectValue(parseObjectValue({ ...objectValue }));
  };

  const addNewKeyValuePair = (event: MouseEvent) => {
    event.preventDefault();

    const key = getNextKey(objectValue, resource, tm);

    objectValue[key] = {};

    setObjectValue(parseObjectValue({ ...objectValue }));
  };

  const handleRemoveItem = (key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _removedKey, ...objectCopy } = objectValue;

    setObjectValue(parseObjectValue(objectCopy));
  };

  useEffect(() => {
    onChange(
      property.path,
      Object.entries(objectValue).map(([key, value]) => ({
        ...value,
        id: key,
      }))
    );
  }, [objectValue]);

  const error = record.errors?.[property.path];
  if (property.description === undefined) {
    property.description = tm("keyValuePropertyDefaultDescription", resource.id);
  }

  return (
    <FormGroup error={!!error}>
      <PropertyLabel property={property} />
      <Section {...property.props}>
        {Object.entries(objectValue).map(([key, value]) => (
          <EditKeyValuePair
            key={key}
            property={property}
            objectValue={value}
            objectKey={key}
            Form={Form}
            onKeyChange={handleKeyChange}
            onValueChange={handleValueChange}
            onRemoveItem={handleRemoveItem}
            error={record.errors[`${property.path}${flat.DELIMITER}${key}`]}
          />
        ))}
        <Button mt="lg" onClick={addNewKeyValuePair}>
          {tb("addNewItem", resource.id)}
        </Button>
      </Section>
      <FormMessage>{error?.message}</FormMessage>
    </FormGroup>
  );
};
