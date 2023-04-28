const AWS = require('aws-sdk');
const sns = new AWS.SNS();


// UNUSED, SET UP TO SUBSCRIBE LAMBDA TO SNS TOPIC PUBLISHED MESSAGED FROM REKOGNITION.

exports.handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    if (event.httpMethod && event.httpMethod === "POST") {
        const topicArn = event.queryStringParameters.topicArn;
        const file = event.queryStringParameters.fileName
        const functionName = context.functionName;
        const lambda = new AWS.Lambda();

        const triggerParams = {
            Action: 'lambda:InvokeFunction',
            FunctionName: functionName,
            Principal: 'sns.amazonaws.com',
            SourceArn: topicArn,
            StatementId: `sns-${functionName}-${file}`
        };
        try {
            await lambda.addPermission(triggerParams).promise();
            console.log(`Added SNS topic '${topicArn}' as a trigger for Lambda '${functionName}'`);
        } catch (err) {
            console.error(err)
        }

        try {
            const result = await lambda.getFunction({FunctionName: functionName}).promise();
            const lambdaArn = result.Configuration.FunctionArn;

            console.log(lambdaArn)

            const params = {
                Protocol: 'lambda',
                TopicArn: topicArn,
                Endpoint: lambdaArn
            };

            console.log(JSON.stringify(params))

            try {
                await sns.subscribe(params).promise();
                console.log(`Subscribed Lambda '${lambdaArn}' to SNS topic '${topicArn}'`);
              } catch (err) {
                console.error(`Failed to subscribe Lambda '${lambdaArn}' to SNS topic '${topicArn}':`, err);
                throw(err)
              }

            // Call the function that subscribes the Lambda to an SNS topic with the lambdaArn
            return {
                statusCode: 200,
            //  Uncomment below to enable CORS requests
                headers: {
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Headers": "*"
                }, 
                body: JSON.stringify('Hello from Lambda!'),
            };
        } catch (err) {
            console.error(err);
            throw(err)
        }
    } else {
        console.info(JSON.stringify(event.sns))
        throw(TypeError)
    }
};
