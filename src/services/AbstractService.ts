import httpStatusCodes from 'http-status-codes';
import IResult from '../interfaces/IResult';

export default class AbstractService {
    public responseResult: IResult;

    constructor() {
        this.responseResult = {
            statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Error processing request.',
            results: {},
        };
    }

    public async processSuccessfulResponse(
        response: any,
        message: string = 'Successfully processed request.',
    ) {
        this.responseResult.results = response;
        this.responseResult.message = message;
        this.responseResult.statusCode = httpStatusCodes.OK;
    }
}