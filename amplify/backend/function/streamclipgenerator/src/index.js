/* Amplify Params - DO NOT EDIT
	API_CROWDCTRLDB_GRAPHQLAPIENDPOINTOUTPUT
	API_CROWDCTRLDB_GRAPHQLAPIIDOUTPUT
	API_CROWDCTRLDB_GRAPHQLAPIKEYOUTPUT
	ENV
	FUNCTION_CLIPGENERATOR_NAME
	REGION
	STORAGE_S3340A859D_BUCKETNAME
Amplify Params - DO NOT EDIT */

// Import necessary modules
const { default: fetch, Request } = require("node-fetch");
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();

// Set GraphQL endpoint and API key using environment variables
const GRAPHQL_ENDPOINT = process.env.API_CROWDCTRLDB_GRAPHQLAPIENDPOINTOUTPUT;
const GRAPHQL_API_KEY = process.env.API_CROWDCTRLDB_GRAPHQLAPIKEYOUTPUT;

// Get the function name of the clip generator using an environment variable
const CLIP_LAMBDA = process.env.FUNCTION_CLIPGENERATOR_NAME;

// GraphQL query to retrieve video reports with non-empty stream URLs
const query = `
	query ListVideoReportsWithStreamUrl {
		listVideoReports(
			filter: { streamUrl: { ne: null }, streamUrl: { ne: "" } }
		) {
			items {
				id
				userEmail
				peopleCount
				tag
				videoUrls
				streamUrl
				topicArn
				jobIds
			}
		}
	}
`;

// GraphQL mutation to update video report data with job IDs and video URLs
const updateMutation = `
  mutation UpdateVideoReport($id: ID!, $jobIds: [String!], $videoUrls: [String!]) {
    updateVideoReport(input: {id: $id, jobIds: $jobIds, videoUrls: $videoUrls }) {
      id
      jobIds
      videoUrls
    }
  }
`;

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
	/** @type {import('node-fetch').RequestInit} */

  // Set request options to send GraphQL query to endpoint with API key header,
  // API Key's aren't ideal but what we could get to work.
	const options = {
		method: "POST",
		headers: {
			"x-api-key": GRAPHQL_API_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query }),
	};

  // Create a new request object with GraphQL endpoint and options
	const request = new Request(GRAPHQL_ENDPOINT, options);

	let statusCode = 200;
	let body;
	let response;
	let result;

	try {
    // Send request to the GraphQL endpoint and wait for response
		response = await fetch(request);
		result = await response.json();
		if (result.errors) {
      // Set status code to 400 if there are any errors in the GraphQL response
			statusCode = 400;
		} else {
			console.log(JSON.stringify(result));
		}
	} catch (error) {
    // Set status code to 400 and create error response body if an error occurs
		statusCode = 400;
		body = {
			errors: [
				{
					status: response.status,
					message: error.message,
					stack: error.stack,
				},
			],
		};
		return {
			statusCode: statusCode,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "*",
			},
			body: body,
		};
	}

  // Get an array of AWS Lambda invoke parameters for each video report with non-empty stream URL
  // Pulls their id, streaumUrl and topicArn, the last two are needed for Rekognition.
	const params = result.data.listVideoReports.items.map(
		({ id, streamUrl, topicArn }) => ({
			FunctionName: CLIP_LAMBDA,
			Payload: JSON.stringify({ id, streamUrl, topicArn }),
		})
	);

	let results;
	try {
    // Invoke the clip generator Lambda function for each video report with non-empty stream URL.
    // Invoked asynced, joined wait until all are finished.
		results = await Promise.all(
			params.map((params) => lambda.invoke(params).promise())
		);

		try {
      // For each result from the clip generator Lambda function, invoke async GRAPHQL Mutations, joined wait at the end.
			const promises = results.map(async (r) => {
				if (!r.FunctionError) {
					const body = JSON.parse(JSON.parse(r.Payload).body);
					console.log(body);

          // prepare input variables for the video report update mutation
					const input = {
						id: body.id,
						jobIds: [body.jobId],
						videoUrls: [body.key],
					};

          // create a request to update the video report with new clip job IDs and video URLs
					const updateRequest = new Request(GRAPHQL_ENDPOINT, {
						method: "POST",
						headers: {
							"x-api-key": GRAPHQL_API_KEY,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							query: updateMutation,
							variables: input,
						}),
					});

					try {
            // send the update request and log the response
						const res = await fetch(updateRequest);

						const temp = await res.json();

						console.log(JSON.stringify(temp));
					} catch (error) {
						console.log(error);
					}
				}
			});
      // wait for all update requests to complete
			await Promise.all(promises);
		} catch (err) {
			console.log(err);
		}
	} catch (err) {
		console.log(err);
	}
  // return response with status code, headers, and results, not really used at all after invoking.
	return {
		statusCode,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "*",
		},
		body: JSON.stringify(results),
	};
};
