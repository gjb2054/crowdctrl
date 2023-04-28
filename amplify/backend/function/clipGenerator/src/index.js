/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_S3340A859D_BUCKETNAME
Amplify Params - DO NOT EDIT */

// Import necessary modules
const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ffmpegPath = './bin/ffmpeg'; // Path to ffmpeg binary
const exec = require('await-exec');
const bucketName = process.env.STORAGE_S3340A859D_BUCKETNAME; // Name of the S3 bucket
const rekognition = new AWS.Rekognition({region:"us-east-1"}); // Rekognition client
const lambda = new AWS.Lambda(); // Lambda client

/**
 * Lambda function handler for generating string clips, from a stream URL.
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // Extract necessary information from the event object
    const stream = event.streamUrl; // Streaming URL
    const topicArn = event.topicArn; // SNS topic ARN
    const id = event.id; // ID

    // Retrieve function name and role ARN from the Lambda configuration
    const functionName = context.functionName;
    const lambdaInfo = await lambda.getFunctionConfiguration({ FunctionName: functionName }).promise();
    const roleArn = lambdaInfo.Role;

    // Generate a unique output filename with the current date and time
    const date = new Date();
    const dateString = `${date.getMonth()+1}-${date.getDate()}-${date.getFullYear()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}`
    const duration = '3'; // Duration of the clip, set to 3 seconds.
    const output = `/tmp/${dateString}output.mp4` // Output filename
    const key = `public/${dateString}output.mp4` // S3 object key

    // Use ffmpeg to generate a 3-second video clip from the streaming URL and save it to a temporary file
    const makeMp4 = `${ffmpegPath} -i ${stream} -t ${duration} ${output}`
    try {
        await exec(makeMp4); // Executes ffmpeg to clip the mjpg stream.
        console.log("Succes Generating Clip");

        // Upload the temporary file to an S3 bucket with public-read ACL
        const params = {Bucket: bucketName, Key: key, Body: fs.createReadStream(output), ACL: 'public-read',}
        try {
            await s3.upload(params).promise()
            console.log("Success")
        } catch (err) {
            console.error(err)
        }
    } catch (err) {
        console.error(err)
    }

    // Call Amazon Rekognition to detect people in the video
    try {
        const response = await rekognition.startPersonTracking({
            Video: {
                S3Object: {
                    Bucket: bucketName,
                    Name: key
                }
            },
            NotificationChannel: { 
                RoleArn: roleArn,
                SNSTopicArn: topicArn
            },
        }).promise();

        // Return a response object that includes the Rekognition job ID, S3 bucket key, and ID
        return {
            statusCode: 200,
            body: JSON.stringify({
                jobId: response.JobId,
                key: key,
                id: id,
            })
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
};
