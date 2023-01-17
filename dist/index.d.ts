/**
 * Split csv readable stream into multiple write streams
 * @param {Readable} inputStream readable csv stream
 * @param {any} opts delimeter and lineLimit options as an object
 * @param {function} createOutputStreamCallback callback function to be executed on each chunk.
 * @returns {Promise<object>} returns object with total chunks and specified options
 */
export function splitStream(inputStream: Readable, opts: any, createOutputStreamCallback: Function): Promise<object>;
/**
 * Split csv readable stream into multiple strings
 * @param {Readable} inputStream readable csv stream
 * @param {any} opts delimeter and lineLimit options as an object
 * @param {function} createOutputStringCallback callback function to be executed on each chunk.
 * @returns {Promise<object>} returns object with total chunks and specified options
 */
export function split(inputStream: Readable, opts: any, createOutputStringCallback: Function): Promise<object>;
//# sourceMappingURL=index.d.ts.map