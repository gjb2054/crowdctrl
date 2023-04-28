// Video.js
import { useEffect, useState } from "react";
import {
	Button,
	View,
	Heading,
	Flex,
	Card,
	Divider,
	Badge
} from "@aws-amplify/ui-react";
import { FiDelete } from "react-icons/fi";
import { DataStore } from "aws-amplify";

import Video from "./Video";

const VideoReportCard = ({ report, getUserReports, bucketName }) => {
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
    }, [report]);

    // * Handler
	/**
	 * Deletes the given VideoReport
	 * @param {VideoReport} report
	 */
	const handleRemoveVideoReport = async (report) => {
		await DataStore.delete(report);
        await getUserReports();
	};

    // * Helpers
	/**
	 * Determine how many people exist and assign a string tag for a video report
	 * @param {VideoReport} report
	 * @returns String tag of number of people
	 */
	const getPeopleTag = (report) => {
		if (report.peopleCount != null && report.peopleCount.length > 0) {
			const peopleNum = report.peopleCount[report.peopleCount.length - 1];
			switch (true) {
				case peopleNum === 0:
					return "Empty";
				case peopleNum === 1:
					return "Single";
				case peopleNum >= 2 && peopleNum <= 7:
					return "Group";
				case peopleNum > 7 && peopleNum <= 20:
					return "Gathering";
				case peopleNum > 20 && peopleNum <= 50:
					return "Party";
				case peopleNum > 50 && peopleNum <= 100:
					return "Event";
				case peopleNum > 100:
					return "Crowded";
				default:
					return "N/A";
			}
		} else {
			return "N/A";
		}
	};

	return (
		<Card
            className="report-card"
			borderRadius="medium"
			maxWidth="20rem"
			variation="outlined">
			<Flex
				className="card-header"
				direction="row"
				justifyContent="space-between"
				alignItems="center">
				<Heading>Video Report</Heading>
				<Button
					className="delete-report"
					variation="warning"
					size="small"
					onClick={() => handleRemoveVideoReport(report)}>
					<FiDelete />
				</Button>
			</Flex>
			<Video report={report} bucketName={bucketName}></Video>
			<View padding="xs">
				<Flex justifyContent="space-between">
					<Badge backgroundColor="blue.40">
						{report.streamUrl != null && report.streamUrl !== ""
							? "STREAM"
							: "VIDEO"}
					</Badge>
					<Badge backgroundColor="red.40">
						{getPeopleTag(report)}
					</Badge>
				</Flex>
				<Divider padding="xs" />
				<Heading padding="xs">
					People:{" "}
					{report.peopleCount != null && report.peopleCount.length > 0
						? report.peopleCount[report.peopleCount.length - 1]
						: "Unknown"}
				</Heading>
				{report.peopleCount != null &&
					report.peopleCount.length > 1 && report.streamUrl != null && report.streamUrl !== "" && (
						<Flex className="expanded-stream" padding="xs" direction="column">
							<Button
								onClick={() => setExpanded(!expanded)}
								variation="info">
								{expanded ? "Hide" : "Show"} People Counts
							</Button>
							{expanded && (
								<ul>
									{report.peopleCount.map((count, i) => (
										<li key={i}>
											Clip {i}: {count} people
										</li>
									))}
								</ul>
							)}
						</Flex>
					)}
			</View>
		</Card>
	);
};

export default VideoReportCard;
