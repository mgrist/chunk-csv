"use strict";

const fs = require("fs"),
  debug = require("debug")("chunk-csv-test"),
  stream = require("stream"),
  chai = require("chai"),
  path = require("path"),
  assert = chai.assert,
  chunkCsv = require("../index.js");

chai.use(require("chai-as-promised"));

describe("chunk-csv with multiple streams", function () {
  let actualOutputs, expectedOutputs;

  function assertSuccess(promise) {
    return promise.then(() => {
      debug("Actual outputs were:");
      actualOutputs.map((item) => {
        debug("=====");
        debug(item);
      });

      debug("Expected outputs were:");
      expectedOutputs.map((item) => {
        debug("=====");
        debug(item);
      });
      assert.deepEqual(actualOutputs, expectedOutputs);
    });
  }

  function assertError(promise, errorMatcher) {
    return assert.isRejected(promise, errorMatcher);
  }

  function runTest(caseName, numberOfOutputFiles) {
    expectedOutputs = new Array(numberOfOutputFiles);
    for (let i = 0; i < numberOfOutputFiles; i++) {
      expectedOutputs[i] = fs.readFileSync(
        path.resolve(__dirname, `cases/${caseName}/output${i}.csv`),
        "utf-8"
      );
    }

    actualOutputs = new Array(numberOfOutputFiles);
    return chunkCsv.splitStream(
      fs.createReadStream(
        path.resolve(__dirname, `cases/${caseName}/input.csv`)
      ),
      require(path.resolve(__dirname, `cases/${caseName}/params.json`)),
      (index) => {
        const outputStream = new stream.PassThrough();
        actualOutputs[index] = new Buffer.from("");
        outputStream.on("data", (data) => {
          actualOutputs[index] += data;
        });

        return outputStream;
      }
    );
  }

  it("even-split", function () {
    return assertSuccess(runTest("even-split", 3));
  });

  it("uneven-split", function () {
    return assertSuccess(runTest("uneven-split", 4));
  });

  it("header-only", function () {
    return assertSuccess(runTest("header-only", 1));
  });

  it("no-split", function () {
    return assertSuccess(runTest("no-split", 1));
  });

  it("empty", function () {
    return assertError(runTest("empty", 0), /The provided CSV is empty/);
  });

  it('rejects when "error" fired by input stream', function () {
    return assertError(
      chunkCsv.splitStream(
        fs.createReadStream("non-existing-file"),
        {
          lineLimit: 3
        },
        () => {
          throw new Error("should never be called");
        }
      ),
      /ENOENT: no such file or directory/
    );
  });

  it("rejects when input stream is not readable", function () {
    return assertError(
      chunkCsv.splitStream(
        new stream.Writable(),
        {
          lineLimit: 3
        },
        () => {
          throw new Error("should never be called");
        }
      ),
      /readStream must be readable/
    );
  });

  it("rejects when lineLimit is 0", function () {
    return assertError(
      chunkCsv.splitStream(new stream.Readable(), () => {
        throw new Error("should never be called");
      }),
      /Provide non-negative lineLimit/
    );
  });

  it("rejects when lineLimit is negative", function () {
    return assertError(
      chunkCsv.splitStream(new stream.Readable(), {
        lineLimit: -10
      }),
      /Provide non-negative lineLimit/
    );
  });

  it("rejects when lineLimit is not provided", function () {
    return assertError(
      chunkCsv.splitStream(new stream.Readable(), {
        otherSettings: 10
      }),
      /Provide non-negative lineLimit/
    );
  });

  it("rejects when inputStream is not provided", function () {
    return assertError(
      chunkCsv.splitStream(null, {
        lineLimit: 10
      }),
      /Provide inputStream/
    );
  });
});
