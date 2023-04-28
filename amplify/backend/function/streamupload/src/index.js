/* Amplify Params - DO NOT EDIT
	API_CROWDCTRLDB_GRAPHQLAPIENDPOINTOUTPUT
	API_CROWDCTRLDB_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

// Import necessary modules
import crypto from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { default as fetch, Request } from 'node-fetch';

// Set GraphQL endpoint and AWS region using environment variables
const GRAPHQL_ENDPOINT = process.env.API_CROWDCTRLDB_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Import Sha256 function from crypto module
const { Sha256 } = crypto;


// GraphQL mutation to create a video report
const query = `
  mutation CreateVideoReport($input: CreateVideoReportInput!) {
    createVideoReport(input: $input) {
      userEmail
      peopleCount
      tag
      videoUrls
      streamUrl
      topicArn
    }
  }
`;


/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

 export const handler = async (event) => {
  // Log the event received by the function
  console.log(`EVENT: ${JSON.stringify(event)}`);

  // Get GraphQL endpoint URL and AWS region from environment variables
  const endpoint = new URL(GRAPHQL_ENDPOINT);
  const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

  // Get required parameters from query string parameters of the HTTP request
  const email = event.queryStringParameters.userEmail
  const streamUrl = event.queryStringParameters.streamUrl
  const topicArn = event.queryStringParameters.topicArn

  // Create a signer object for AWS Signature Version 4 signing process
  const signer = new SignatureV4({
    credentials: defaultProvider(),  // use the default credential provider chain
    region: AWS_REGION,  // set the AWS region
    service: 'appsync',  // set the service name for AppSync
    sha256: Sha256  // set the hashing algorithm to use
  });

  // Init the Video Report Object with the following fields.
  const variables = {
    input: {
      userEmail: email,
      peopleCount: [],
      videoUrls: [],
      tag: '',
      streamUrl: streamUrl,
      topicArn: topicArn
    },
  };

  // Create an HTTP request object to be signed and sent to the AppSync GraphQL endpoint
  const requestToBeSigned = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: endpoint.host
    },
    hostname: endpoint.host,
    body: JSON.stringify({ query, variables }),
    path: endpoint.pathname
  });
  
  // Sign the HTTP request using Signature Version 4
  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(endpoint, signed);

  let statusCode = 200;
  let body;
  let response;

  // Send the signed HTTP request to the AppSync GraphQL endpoint and handle the response
  try {
    response = await fetch(request);
    body = await response.json();
    if (body.errors) statusCode = 400;
  } catch (error) {
    statusCode = 500;
    body = {
      errors: [
        {
          message: error.message
        }
      ]
    };
  }

  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*"
    }, 
    body: JSON.stringify(body)
  };
};