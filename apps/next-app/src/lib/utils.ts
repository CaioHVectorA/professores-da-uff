import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSemester(semester: string | null | undefined): string {
  if (!semester || semester.length !== 5) return "";

  const year = semester.substring(2, 4); // Get last 2 digits of year
  const period = semester.substring(4); // Get the period (1 or 2)

  return `${year}.${period}`;
}
