/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

// Import AWS SDK and create Rekognition client
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition({region:"us-east-1"});

exports.handler = async (event, context) => {
    // Log the event trigger.
    console.log(JSON.stringify(event))

    // Get the name of the current Lambda function and create a new Lambda client.
    const functionName = context.functionName;
    const lambda = new AWS.Lambda();

    // Get configuration information about the Lambda function
    const lambdaInfo = await lambda.getFunctionConfiguration({ FunctionName: functionName }).promise();

    // Log the info.
    console.log(JSON.stringify(lambdaInfo))

    // Extract the lambda Arn from lambda info
    const roleArn = lambdaInfo.Role;

    // Note we realized we could access these parameters from within the Lambda later on, and would refactor this code to
    // recieve the S3 bucket from the event.
    const bucketName = event.queryStringParameters.bucketName; // S3 bucket name where the video is stored,
    const key = event.queryStringParameters.key; // S3 object key for the video
    const topicArn = event.queryStringParameters.topicArn; // SNS topic ARN for receiving notifications

    try {
        // Call Amazon Rekognition to detect people in the video
        const response = await rekognition.startPersonTracking({
        Video: {
            S3Object: {
            Bucket: bucketName,
            Name: key
            }
        },
        NotificationChannel: { 
            RoleArn: roleArn, // Uses the Lambda Execution Role, to try and pass permissions to Rekognition, but did not work.
            SNSTopicArn: topicArn
        },
        }).promise();

        // Return the job ID to the caller
        return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({
            jobId: response.JobId
        })
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
};
