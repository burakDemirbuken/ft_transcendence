// Global type declarations

declare global {
  interface Element {
    matches(selectors: string): boolean;
    classList: DOMTokenList;
    getAttribute(name: string): string | null;
  }

  interface EventTarget {
    matches?(selectors: string): boolean;
    classList?: DOMTokenList;
    getAttribute?(name: string): string | null;
  }

  // Make FormDataEntryValue always assignable to string for our use case
  interface FormData {
    get(name: string): string;
  }
}

// Chart.js type declaration
declare const Chart: any;

// BABYLON.js type declaration
declare const BABYLON: any;

// Function declarations
declare function toggle(e: any): void;

export {};
