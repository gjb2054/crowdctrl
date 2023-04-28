const AWS = require('aws-sdk');
const sns = new AWS.SNS();

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    // Log Events Info
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // Get Topic Name and Email
    const topic = event.queryStringParameters.topic
    const email = event.queryStringParameters.email

    // Creeate Topic with Name
    const result = await sns.createTopic({ Name: topic }).promise();

    // Set Topic Arn
    const topicArn = result.TopicArn;

    // Policy stuff used to try and get Rekognition permsissions to send events to SNS, did not work.
    const policy = {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "AWS": "*",
              "Service": "rekognition.amazonaws.com"
            },
            "Action": [
                "SNS:GetTopicAttributes",
                "SNS:SetTopicAttributes",
                "SNS:AddPermission",
                "SNS:RemovePermission",
                "SNS:DeleteTopic",
                "SNS:Subscribe",
                "SNS:ListSubscriptionsByTopic",
                "SNS:Publish",
                "SNS:Receive"
            ],
            "Resource": topicArn
          }
        ]
      };
      
      // Update SNS Policy to allow Reko to send events, did not work.
      const r1 = await sns.setTopicAttributes({
        TopicArn: topicArn,
        AttributeName: 'Policy',
        AttributeValue: JSON.stringify(policy)
      }).promise();

      // Subscribe Email Params to topicArn, ended up being unused, due to Rekognition bug.
      const params = {
        Protocol: 'email',
        TopicArn: topicArn,
        Endpoint: email
      };

      // Subscribe Email to SNS Topic
      const r2 = await sns.subscribe(params).promise();

    return {
        statusCode: 200,
        headers: {
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Allow-Headers": "*"
        }, 
        body: topicArn
    };
};
