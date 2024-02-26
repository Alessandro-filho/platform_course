declare module '*.md' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const value: any;
  export = value;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}