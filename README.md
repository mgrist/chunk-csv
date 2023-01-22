# chunk-csv
[![Coverage Status](https://coveralls.io/repos/github/mgrist/chunk-csv/badge.svg?branch=master)](https://coveralls.io/github/mgrist/chunk-csv?branch=master)

Splits a CSV read stream into multiple write streams or strings. <br><br>
This library was forked from [csv-split-stream](https://github.com/alex-murashkin/csv-split-stream), an extra method was added and the previous code was updated to support async functions within the callback functions. Feel free to submit a PR or issue containing any bug fixes or feature requests.

## Install

`npm install chunk-csv`

## Usage
### Using write streams
1. Split a local CSV file into multiple CSV files (10000 lines each, excluding the header row):

  ```javascript
  const chunkCsv = require('chunk-csv');

  return chunkCsv.splitStream(
    fs.createReadStream('input.csv'),
    {
      lineLimit: 100
    },
    (index) => fs.createWriteStream(`output-${index}.csv`)
  )
  .then(csvSplitResponse => {
    console.log('csvSplitStream succeeded.', csvSplitResponse);
    // outputs: {
    //  "totalChunks": 350,
    //  "options": {
    //    "delimiter": "\n",
    //    "lineLimit": "10000"
    //  }
    // }
  }).catch(csvSplitError => {
    console.log('csvSplitStream failed!', csvSplitError);
  });
  ```

2. Download a large CSV file via HTTP, split it into chunks of 10000 lines and upload each of them to s3:

  ```javascript
  const http           = require('http'),
  const chunkCsv = require('csv-split-stream');
  const AWS            = require('aws-sdk'),
  const s3Stream       = require('s3-upload-stream')(new AWS.S3());

  function downloadAndSplit(callback) {
    http.get({...}, downloadStream => {
      chunkCsv.splitStream(
        downloadStream,
        {
          lineLimit: 10000
        },
        (index) => s3Stream.upload({
          Bucket: 'testBucket',
          Key: `output-${index}.csv`
        })
      )
      .then(csvSplitResponse => {
        console.log('csvSplitStream succeeded.', csvSplitResponse);
        callback(...);
      }).catch(csvSplitError => {
        console.log('csvSplitStream failed!', csvSplitError);
        callback(...);
      });
    });    
  }
  ```
  
  ## Methods
 `splitStream(readable, options, callback(index))`<br>
 The `splitStream` method splits a CSV readable stream into multiple write streams and takes 3 arguments.
 1. readable is a readable stream from your csv file.
 2. options object:
     `delimiter` (defaults to "\n"), `lineLimit` number of lines per chunk.
 3. callback(index) - for every chunk of csv this callback function will be executed. **A stream that is writable must be returned from this callback** (can be a write or read/write stream). The chunks of csv data will be piped to this write stream. The `index` argument is given which specifies the chunk number being processed.
 <br>
 
 `split(readable, options, callback(chunk, index))` <br>
 The `split` method splits a CSV readable stream into multiple, smaller strings.
 1. readable is a readable stream from your csv file.
 2. options object:
     `delimiter` (defaults to "\n"), `lineLimit` number of lines per chunk.
 3. callback(chunk, index) - for every chunk of csv this callback function will be executed. The `chunk` argument will be the raw csv data with the specified number of lines and `index` specifies the chunk number being processed.
 
 ## Notes
 This module will use the first row as a header, so make sure your CSV has a header row. Currently working on a solution to support a "no headers" option.
