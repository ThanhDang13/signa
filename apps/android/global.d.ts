/// <reference types="nativewind/types" />

// Allow importing CSS files
declare module '*.css' {
  const content: any;
  export default content;
}
