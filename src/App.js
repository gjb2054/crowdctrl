import "@aws-amplify/ui-react/styles.css";
import {
	withAuthenticator,
	Button,
	View,
	Heading,
	FileUploader,
	Flex,
	Collection,
} from "@aws-amplify/ui-react";

import { BiRefresh } from "react-icons/bi";
import { TiDocumentDelete } from "react-icons/ti";
import { AiOutlinePaperClip } from "react-icons/ai";

import React from "react";
import NavBar from "./Components/NavBar.js";
import "./App.css";
import { API, Auth, Storage, DataStore } from "aws-amplify";
import { useState, useEffect } from "react";
import { VideoReport } from "./models";
import awsconfig from "./aws-exports";

import VideoReportCard from './Components/VideoReportCard';

const bucketName = awsconfig.aws_user_files_s3_bucket;

function App({ signOut }) {
	const [user, setUser] = useState(null);
	const [userEmail, setUserEmail] = useState("");
	const [videoUrl, setVideoUrl] = useState("");
	const [reports, setReports] = useState([]);
	const [streamUrl, setStreamUrl] = useState("");
	const [displayStream, setDisplayStream] = useState(false);
	const [processing, setProcessing] = useState(false);

	// * Data Manipulation

	useEffect(() => {
		Auth.currentAuthenticatedUser({
			bypassCache: true, // Optional, By default is false. If set to true, this call will send a request to Cognito to get the latest user data
		})
			.then((user) => {
				setUser(user);
				setUserEmail(user.attributes.email);
				getUserReports(user.attributes.email);
			})
			.catch((err) => console.error(err));
	}, []);

	/**
	 * Grabs all the current VideoReports for a given user email
	 * @param {String} email user email
	 */
	const getUserReports = async (email) => {
		await DataStore.stop();
		await DataStore.start(); // Refresh Local Datastore with Dynamo DB

    // Sets email if we don't have it
		if (!email) email = userEmail ?? user?.attributes?.email;

    // Queries data store for all video reports associated with the email.
		const reports = await DataStore.query(VideoReport, (report) => true)

    // Sets Reports and logs them
		setReports(reports);
		console.log('reports', reports); // Would be removed in prod.
	};

	/**
	 * Delete all video reports
	 */
	const removeVideoReports = async () => {
		let deletePromises = [];
		reports.forEach((report) => {
			deletePromises = [...deletePromises, DataStore.delete(report)];
		});
		await Promise.all(deletePromises);
		await getUserReports();
	};

	/**
	 * Loop over reports and process their people counting jobs if completed
   * 
   * Refresh Button Method.
   * 
	 * @param {Boolean} refresh flag for refreshing reports
	 */
	const processVideoReports = async (refresh = false) => {
		if (processing) return; // Checks to see if we are currently processisng.

		setProcessing(true); // Sets state that we are currently processing
		if (refresh !== false) await getUserReports(); // If this wasn't invoked via refresh, get user reports, first

    // Loop through each video report asynchronously.
		await reports.forEach(async (report) => {

      // Checks if the report has an array of jobIds.
			if (report.jobIds != null) {

        // Checks if the report is a video report or a stream report.
				let reportIsStream = report.streamUrl != null && report.streamUrl !== "";

        // Initializes completeted Jobs.
				let completedJobs = [];

        // Gets current people counts, [] if its null.
				let updatedPeopleCount = report.peopleCount
					? [...report.peopleCount]
					: [];

        // Skip Job initialized to false
				let skipJob = false;

        // Async Loops over all jobIds, if you have multiple clips in a video report you would have multipls JobIds if they haven't been processed
				const jobPromises = report.jobIds.map(async (jobId) => {
					console.log('job', jobId); // Logs jobId, would be removed in prod.

          // If not skip job, get jobResults of the individual jobId
					if (!skipJob) {
						const numPeople = await getJobResults(
							null,
							jobId,
							false
						);

						console.log(numPeople); // Log number of people.
						if (numPeople !== false) { // Will not be false if the reko jobId is finished, otherwise will.

              // If report is a stream, append numPeople to end of the current peoplecount array
							if (report.peopleCount != null && reportIsStream) {
								updatedPeopleCount = [
									...updatedPeopleCount,
									numPeople,
								];
              // If the report is a video, set numPeople to array of numPeople.
							} else if (report.peopleCount != null && !reportIsStream) {
								updatedPeopleCount = [numPeople];
							}

              // Append jobId to completed jobs
							completedJobs = [...completedJobs, jobId];

						} else if (reportIsStream) { // If report is a stream, and numPeople === false, skip this jobId
							skipJob = true;
						}
					}
				});

				console.log(updatedPeopleCount); // Log updated people count, would be removed in prod
				await Promise.all(jobPromises); // Await all jobs.
				skipJob = false; // Reset Skip Job


				let ongoingJobs = [...report.jobIds]; // Set ongoing jobs
				if (report.jobIds != null && completedJobs.length > 0) {
					ongoingJobs = report.jobIds.filter(
						(job) => !completedJobs.includes(job)
					);
				}

        // Save Results
				await DataStore.save(
					VideoReport.copyOf(report, (updated) => {
						updated.jobIds = ongoingJobs;
						updated.peopleCount = updatedPeopleCount;
					})
				);
			}
		});
		await getUserReports();
		setProcessing(false);
	};

	/**
	 * Processes a rekognition job to get the count of people
	 * @param {String} url Uplodaded video S3 url
	 * @param {String} jobId ID of rekognition job
	 * @param {Boolean} saveReport Flag for sending the report to the db
	 * @returns {Number} || {Boolean}
	 */
	const getJobResults = async (url, jobId, saveReport = false) => {
		// Pass the credentials directly to the Rekognition instance
		const checkerInit = {
			headers: {}, // OPTIONAL
			response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
			queryStringParameters: {
				jobId: jobId, // OPTIONAL
				maxResults: 1000,
			},
		};

		const apiName = "crowdctrl";
		const data = await API.post(apiName, "/poll", checkerInit);
		const res = data.data;

		// 3.4 Process the results and display the count of unique people
		if (res.JobStatus === "SUCCEEDED") {
			const uniquePeople = new Set(
				res.Persons.map((person) => person.Person.Index)
			);
			const people = uniquePeople.size;
			if (saveReport) {
				await createVideoReport(url, jobId, people);
			}
			return people;
		} else {
			if (saveReport) {
				await createVideoReport(url, jobId, false);
			}
			return false;
		}
	};

	/**
	 * Save a new video report to the database
	 * @param {String} url video url
	 * @param {String} jobId Rekognition Job ID
	 * @param {Number} || {Boolean} people count of people or false if not compelte
	 */
	const createVideoReport = async (url, jobId, people) => {
		await DataStore.save(
			new VideoReport({
				userEmail: user.attributes.email,
				peopleCount: people !== false ? [people] : [],
				tag: "",
				videoUrls: [url],
				streamUrl: "",
				jobIds: [jobId],
			})
		);
		await getUserReports();
	};

	// * Handlers
	/**
	 * Sends a request to rekognition to count a video URL to create a  job
	 * @param {Event} param0 Video URL key to get S3
	 */
	const handleVideoSuccess = ({ key }) => {
		setDisplayStream(false);
		const apiName = "crowdctrl";
		const rekoPath = "/rekognition";

		Storage.get(key, { level: "public", bucket: bucketName })
			.then((url) => {
				// Update the videoUrl state
				setVideoUrl(url);
			})
			.catch((error) => {
				console.error("Error getting the video URL:", error);
			});

		const topicPath = "/createTopic";
		const topic = key.replace(/\.[^/.]+$/, "").replace(" ", "");
		const topicInit = {
			headers: {}, // OPTIONAL
			response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
			queryStringParameters: {
				topic: `AmazonRekognition${topic}`, // OPTIONAL
				email: user.attributes.email,
			},
		};
		API.post(apiName, topicPath, topicInit).then((resp) => {

			const rekoInit = {
				headers: {}, // OPTIONAL
				response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
				queryStringParameters: {
					bucketName: bucketName,
					key: `public/${key}`,
					topicArn: resp.data,
				},
			};
			API.get(apiName, rekoPath, rekoInit).then((event) =>
				getJobResults(key, event.data.jobId, true)
			);
		});
	};

	/**
	 * Sends the current stream URL to get saved as a VideoReport via Lambda
	 */
	const handleUploadStream = async () => {
		setDisplayStream(true);
		const apiName = "crowdctrl";
		const uploadStreamPath = "/uploadStream";

		const topicPath = "/createTopic";

		const seconds = Math.floor((new Date() - new Date(0)) / 1000);

		const topic = `Stream${seconds.toString()}`;
		const topicInit = {
			headers: {}, // OPTIONAL
			response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
			queryStringParameters: {
				topic: `AmazonRekognition${topic}`, // OPTIONAL
				email: user.attributes.email,
			},
		};

		API.post(apiName, topicPath, topicInit).then((resp) => {
			const streamInit = {
				headers: {}, // OPTIONAL
				response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
				queryStringParameters: {
					topicArn: resp.data,
					streamUrl: streamUrl,
					userEmail: user.attributes.email,
				},
			};

			API.post(apiName, uploadStreamPath, streamInit).catch((error) =>
				console.error(error)
			);
		});
	};

	/**
	 * Updates the current stream URL
	 * @param {Event} e stream link event
	 */
	const handleStreamChange = (e) => {
		setStreamUrl(e.target.value);
	};

	const handleClipStreams = () => {
		const apiName = "crowdctrl";
		const uploadStreamPath = "/clipStreams";

		const clipInit = {
			headers: {}, // OPTIONAL
			response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
		};
		API.post(apiName, uploadStreamPath, clipInit).catch((error) =>
			console.error(error)
		);
	}

	// * HTML Elements

	const videoPreview = displayStream ? (
		<img className="video h-100" src={streamUrl} alt="Stream" />
	) : (
		<video
			className="video h-100"
			id="video-preview"
			controls
			src={videoUrl}
		/>
	);

	return (
		<View className="App">
			<NavBar
				signOut={Auth.signOut}
				email={user && user.attributes.email}
			/>
			<div className="container">
				<div className="left-column">
					<Flex
						className="upload-section"
						direction="column"
						justifyContent="space-between">
						<View>
							<Heading className="subtitle">
								Upload a video!
							</Heading>
							<FileUploader
								acceptedFileTypes={[
									".mp4",
									".mov",
									"video/mp4",
									"video/quicktime",
								]}
								accessLevel="public"
								onSuccess={handleVideoSuccess}></FileUploader>
						</View>

						<View>
							<Heading className="subtitle">
								Or Link a Livestream!
							</Heading>
							<input
								type="topic"
								id="stream_url"
								placeholder="Enter stream"
								value={streamUrl}
								onChange={handleStreamChange}
							/>
							<Button onClick={handleUploadStream}>
								Upload Stream
							</Button>
						</View>
					</Flex>
				</div>
				<div className="right-column">
					<Flex className="video-section h-100" direction="column">
						<Heading className="subtitle">Video Preview</Heading>
						{videoPreview}
					</Flex>
				</div>
			</div>
			<div className="options-section">
				<Flex
					className="mb"
					direction="row"
					justifyContent="space-between">
					<Heading className="subtitle">Video Reports</Heading>
					<View>
						{<Button
							className="mr"
							variation="info"
							gap="0.1rem"
							size="small"
							onClick={() => handleClipStreams()}>
							<AiOutlinePaperClip />
						</Button>}
						<Button
							className="mr"
							variation="primary"
							gap="0.1rem"
							size="small"
							onClick={() => processVideoReports(true)}>
							<BiRefresh />
						</Button>
						<Button
							variation="destructive"
							gap="0.1rem"
							size="small"
							onClick={() => removeVideoReports()}>
							<TiDocumentDelete />
						</Button>
					</View>
				</Flex>
				<Collection
					items={reports}
					type="list"
					direction="row"
					gap="20px"
					wrap="wrap">
					{(item, index) => (
						<VideoReportCard
							key={index}
							report={item}
							getUserReports={getUserReports}
							bucketName={bucketName}></VideoReportCard>
					)}
				</Collection>
			</div>
		</View>
	);
}

export default withAuthenticator(App, {
	IAM: {
		Policy: {
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Action: ["rekognition:*"],
					Resource: [`*`],
				},
			],
		},
	},
});
