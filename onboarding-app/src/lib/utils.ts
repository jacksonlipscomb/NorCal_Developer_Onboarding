import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// intentional lint failure for CI test
export function debugLog(value: any) {
  console.log(value);
}
