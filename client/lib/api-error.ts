export function getApiErrorMessage(error: any): string {
  const data = error?.response?.data;

  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  return "Something went wrong. Please try again.";
}