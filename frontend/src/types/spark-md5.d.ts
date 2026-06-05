declare module "spark-md5" {
  const SparkMD5: {
    new (): {
      append(data: string | ArrayBuffer | Uint8Array): void;
      end(): string;
    };
    hash(str: string): string;
    hashBinary(str: string): string;
    ArrayBuffer: {
      hash(buf: ArrayBuffer, raw?: boolean): string;
    };
  };
  export default SparkMD5;
}
