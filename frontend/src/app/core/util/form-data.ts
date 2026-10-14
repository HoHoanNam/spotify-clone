/**
 * Object → multipart FormData. Arrays become repeated fields (artistIds=1&artistIds=2), which Spring binds
 * to List<Long>; null / undefined / '' are skipped so optional fields stay unset on the server.
 */
export function toFormData(form: object): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(form)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => data.append(key, String(v)));
    } else if (value instanceof File) {
      data.append(key, value, value.name);
    } else {
      data.append(key, String(value));
    }
  }
  return data;
}
