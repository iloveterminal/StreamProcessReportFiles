import Reports from '../services/Reports';

/**
 * Handles all requests to the Lambda.
 *
 * @param event
 */
export const handle = async (event: any) => {
    const service: Reports = new Reports();

    return await service.callGetReportDocument();
};