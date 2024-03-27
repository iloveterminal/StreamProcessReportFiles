# Stream Process Report Files

A demonstration of how to stream process large report files to drastically reduce RAM. This is a TypeScript project which would be compiled and then run on AWS Lambda with Node.js. This project would be used to connect with an API such as the Amazon SP-API to download reports. For larger reports this code would allow you to process the reports utilizing less RAM than the size of the original raw report files. 'Processing report files' means taking a tab or comma delimited string of CSV report data and converting it to a Newline Delimited JSON file (ndjson) saved to an S3 bucket.

This is not a complete project, merely a demonstration of the core functionality, so it will require some modifications to run. The bulk of the core streaming functionality can be found in 'src/services/Reports.ts'.

## Requirements

Install:

- [AWS SAM CLI](https://github.com/awslabs/aws-sam-cli) >= v1.58
- [NodeJS](https://nodejs.org/en/download/) >= v16

## Installation

Install dependencies (recommended to run after every switch to a new branch):

`npm install`

Compile TypeScript once or watch for changes:

`npm run compile`

`npm run watch`

Update AWS credentials by exporting them in your terminal or by storing them in `~/.aws/credentials` under `[default]`:

```shell
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export AWS_SESSION_TOKEN=""
```

```
[default]
aws_access_key_id=
aws_secret_access_key=
aws_session_token=
```

## Start Lambda Locally

Start Lambda:

`npm start`
