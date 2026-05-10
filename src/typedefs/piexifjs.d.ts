declare module 'piexifjs' {
  const piexifjs: {
    remove: (data: string) => string
    load: (data: string) => any
    dump: (exifObj: any) => string
    insert: (exif: string, data: string) => string
  }
  export = piexifjs
}
