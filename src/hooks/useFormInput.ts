import React, { useState } from "react";

export type EventWithTarget = {
  target: {
    name: string;
    value: string;
  };
};

export const useFormInput = <
  T extends Object,
  E extends React.ChangeEvent<HTMLElement> & EventWithTarget,
>(
  initialValue: T,
): [
  { value: T; onChange(e: E): void },
  () => void,
  (name: keyof T, value: unknown) => void,
] => {
  const [value, setValue] = useState(initialValue);
  return [
    {
      value,
      onChange: (e) => {
        const { name, value: newValue } = e.target;
        if (name === "checkbox")
          setValue({
            ...value,
            [name]: newValue === "false" ? "true" : "false",
          });
        else if (name === "file" && e.target instanceof HTMLInputElement) {
          if (!e.target.files) return;
          if (!e.target.multiple)
            setValue({
              ...value,
              [name]: e.target.files.length ? e.target.files[0] : "",
            });
        } else {
          if (newValue.length > 100_000) return;
          setValue({
            ...value,
            [name]: newValue,
          });
        }
      },
    },
    () => setValue(initialValue),
    (name, newValue) => {
      setValue({
        ...value,
        [name]: newValue,
      });
    },
  ];
};
