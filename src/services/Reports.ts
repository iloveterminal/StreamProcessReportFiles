import AbstractService from './AbstractService';
import IResult from '../interfaces/IResult';
import { createReadStream, ReadStream, writeFileSync } from 'fs';
import { Parser } from 'csv-parse';
import { PassThrough, Readable } from 'stream';
import { S3 } from 'aws-sdk';

export default class Reports extends AbstractService {
  // TODO: replace these 2 lines.
  private s3Bucket: string = 'Name_of_S3_bucket_here';
  private reportUniqueId: string = '12345678901234567890';

  /**
   * Due to a 6MB AWS Lambda response limit, save all reports
   * to an S3 bucket and return the bucket/key.
   */
  public async callGetReportDocument(): Promise<IResult> {
    // TODO: replace this line.
    const reportResponse = 'Tab or comma delimited report string, replace with method to get report from API.';

    const detectedDelimiter = this.detectDelimiter(reportResponse);
    /*
     * For large reports the most minimal use of RAM and shortest run time results
     * from first saving the response to a file and creating a read stream from it.
     */
    const filePath: string = `/tmp/${this.reportUniqueId}.txt`;
    writeFileSync(filePath, reportResponse);
    const readStream: ReadStream = createReadStream(filePath);

    const passThruStream = new PassThrough();
    /*
     * Write stream initialization is purposely async
     * to buffer rows as they get read/parsed.
     * Reduces both memory usage and run time for large reports.
     */
    const writeStream = this.getWriteStream(passThruStream);

    // Wait for read parser.
    await this.openReadStream(readStream, passThruStream, detectedDelimiter);

    await writeStream;

    return this.responseResult;
  }

  /**
   * Pipe input stream object to parser.
   * Resolves when parser completes processing all records.
   */
  private openReadStream(
    readStream: Readable,
    passThruStream: PassThrough,
    detectedDelimiter: string,
  ) {
    const parser: Parser = new Parser({
      bom: true,
      columns: true,
      delimiter: detectedDelimiter,
      quote: null,
      skip_empty_lines: true,
      skip_records_with_empty_values: true,
      skip_records_with_error: true,
      trim: true,
    });
    readStream.on('error', (error) => { parser.end(); throw error; });
    readStream.on('end', () => readStream.unpipe(parser));

    return new Promise((resolve: any, reject) => {
      parser.on('readable', () => {
        let record;
        while ((record = parser.read())) {
          // Adding newline to create easily streamable Newline Delimited JSON file.
          if (record) passThruStream.write(`${JSON.stringify(record)}\n`);
        }
      });
      parser.on('unpipe', () => parser.end());
      parser.on('end', () => {
        // End passThruStream when reader completes.
        passThruStream.end();
        resolve();
      });
      parser.on('error', (error) => {
        parser.end();
        reject(error);
      });
      readStream.pipe(parser);
    });
  }

  /**
   * Pipe a writeable stream to the S3 bucket.
   */
  private async getWriteStream(passThruStream: PassThrough) {
    const s3 = new S3();
    const bucketProperties: S3.PutObjectRequest = {
      Bucket: this.s3Bucket,
      // Create easily streamable Newline Delimited JSON file (ndjson).
      Key: `reports/${Date.now()}_${this.reportUniqueId}.ndjson`,
    };
    const uploadParams: S3.PutObjectRequest = {
      ...bucketProperties,
      Body: passThruStream,
    };

    return await s3.upload(uploadParams)
      .promise()
      .then(async () => {
        // TODO: to actually expire reports in 1 day, configure S3 lifecycle rule on bucket.
        const message = 'Successfully processed request.'
          + ' Report saved to provided S3 location, will expire in 1 day.';
        await this.processSuccessfulResponse(bucketProperties, message);
      });
  }

  /**
   * Auto-detect a delimiter from string input.
   */
  private detectDelimiter(input: string): string {
    // Every report response will either be tab or comma delimited.
    const separators: string[] = ['\t', ','];
    const index: number = separators.map((separator) => {
      return input.indexOf(separator);
    }).reduce((prev, cur) => {
      if (prev === -1 || (cur !== -1 && cur < prev)) {
        return cur;
      }

      return prev;
    });

    return input[index] || '\t';
  }
}