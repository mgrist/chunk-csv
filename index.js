"use strict";
const assert = require("assert");
const byline = require("byline");

/**
 *
 * @param {Readable} inputStream readable csv stream
 * @param {any} opts delimeter and lineLimit options as an object
 * @param {function} createOutputStreamCallback callback function to be executed on each chunk.
 * @returns {Promise<object>} returns object with total chunks and specified options
 */
function splitStream(inputStream, opts, createOutputStreamCallback) {
  let outputStream = null;
  let chunkIndex = 0;
  let lineIndex = 0;
  let header;
  const options = {
    delimiter: opts.delimiter || "\n",
    lineLimit: opts.lineLimit
  };

  return new Promise((resolve, reject) => {
    assert(inputStream, "Provide inputStream");
    assert(options.lineLimit > 0, "Provide non-negative lineLimit");
    let lineStream;

    function handleError(err) {
      if (outputStream) {
        outputStream.end();
      }
      reject(err);
      return;
    }

    inputStream.on("error", handleError);

    try {
      lineStream = byline(inputStream);
    } catch (err) {
      handleError(err);
      return;
    }

    lineStream.forEach(async (line) => {
      let relLineIndex = lineIndex % options.lineLimit;
      if (!header) {
        header = line;
      } else {
        if (relLineIndex === 0) {
          if (outputStream) {
            outputStream.end();
          }
          outputStream = await createOutputStreamCallback(chunkIndex++);
          outputStream.write(header);
          outputStream.write(options.delimiter);
        }

        outputStream.write(line);
        outputStream.write(options.delimiter);
        lineIndex++;
      }
    });

    lineStream.on("error", (err) => handleError(err));

    lineStream.on("end", async () => {
      if (!header) {
        reject(new Error("The provided CSV is empty"));
        return;
      }

      if (outputStream) {
        await outputStream.end();
      } else {
        outputStream = await createOutputStreamCallback(chunkIndex++);
        outputStream.write(header);
        outputStream.write(options.delimiter);
        await outputStream.end();
      }

      resolve({
        totalChunks: chunkIndex,
        options: options
      });
    });
  });
}

/**
 *
 * @param {Readable} inputStream readable csv stream
 * @param {any} opts delimeter and lineLimit options as an object
 * @param {function} createOutputStringCallback callback function to be executed on each chunk.
 * @returns {Promise<object>} returns object with total chunks and specified options
 */
function split(inputStream, opts, createOutputStringCallback) {
  let outputString = "";
  let chunkIndex = 0;
  let lineIndex = 0;
  let header;
  const options = {
    delimiter: opts.delimiter || "\n",
    lineLimit: opts.lineLimit,
    header: opts.header || true
  };

  return new Promise((resolve, reject) => {
    assert(inputStream, "Provide inputStream");
    assert(options.lineLimit > 0, "Provide non-negative lineLimit");
    let lineStream;

    function handleError(err) {
      if (outputString) {
        outputString.end();
      }
      reject(err);
      return;
    }

    inputStream.on("error", handleError);

    try {
      lineStream = byline(inputStream);
    } catch (err) {
      handleError(err);
      return;
    }

    lineStream.forEach(async (line) => {
      let relLineIndex = lineIndex % options.lineLimit;
      if (!header) {
        header = line;
      } else {
        if (relLineIndex === 0) {
          if (outputString) {
            await createOutputStringCallback(outputString, chunkIndex++);
            outputString = "";
          }
          outputString += header;
          outputString += options.delimiter;
        }

        outputString += line;
        outputString += options.delimiter;
        lineIndex++;
      }
    });

    lineStream.on("error", (err) => handleError(err));

    lineStream.on("end", async () => {
      if (!header) {
        reject(new Error("The provided CSV is empty"));
        return;
      }

      if (outputString) {
        await createOutputStringCallback(outputString, chunkIndex++);
        outputString = "";
      } else {
        outputString += header;
        outputString += options.delimiter;
        await createOutputStringCallback(outputString, chunkIndex++);
      }

      resolve({
        totalChunks: chunkIndex,
        options: options
      });
    });
  });
}

module.exports = {
  splitStream,
  split
};
