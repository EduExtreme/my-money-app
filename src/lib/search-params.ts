export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
