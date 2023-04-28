const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition({region:"us-east-1"});

/**
 * Polling to see if the Rekognition job is done.
 * This wouldn't be necessary if Reko would be using SNS Properly
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    // Log the event.
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // Get Reko JobId from parameters.
    const jobId = event.queryStringParameters.jobId;
    // Get Max Results.
    const maxResults = event.queryStringParameters.maxResults;


    // Call Rekognition for results.
    const data = await rekognition
      .getPersonTracking({
        JobId: jobId,
        MaxResults: maxResults,
      })
      .promise();
    
    // Log Results
    console.log(JSON.stringify({body:JSON.stringify(data)}))

    // Return Results Directly from Rekognition.
    return {
        statusCode: 200,
        headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
    }, 
        body: JSON.stringify(data),
    };
};
