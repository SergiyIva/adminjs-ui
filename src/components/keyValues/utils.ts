import { ResourceJSON, TranslateFunction } from "adminjs";

export const parseObjectValue = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== ""));

// This is used to prevent empty/duplicate keys from being added to JSON
export const getNextKey = (
  objectValue: Record<string, unknown>,
  resource: ResourceJSON,
  tm: TranslateFunction,
  previousId?: number,
): string => {
  const nextId = previousId
    ? previousId + 1
    : Object.keys(objectValue ?? {}).length + 1;
  const nextKey = `${tm("initialKey", resource.id, { number: nextId })}`;

  if (objectValue[nextKey] !== undefined)
    return getNextKey(objectValue, resource, tm, nextId);

  return nextKey;
};
