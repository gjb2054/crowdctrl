// Video.js
import { useEffect, useState } from 'react';
import { Storage } from 'aws-amplify';

const Video = ({ report, bucketName }) => {
  const [videoUrl, setVideoUrl] = useState('');
    const [useImg, setUseImg] = useState(false);

  useEffect(() => {
    getReportVideoUrl(report, bucketName);
  }, [report, bucketName]);

  const getReportVideoUrl = async (report, bucketName) => {
    if (report.streamUrl != null && report.streamUrl !== "") {
        setUseImg(true);
        setVideoUrl(report.streamUrl);
    } else {
        if (report.videoUrls != null) {
            // return report.videoUrls[0];
            setVideoUrl(await Storage.get(report.videoUrls[0], { level: "public", bucket: bucketName }))
        }
        return "";
    }
  }
  
  const mediaTag = useImg ? (
    <img className="video" src={videoUrl} />
  ) : (
    <video className="video" id="video-preview" controls src={videoUrl} />
  );

  return mediaTag;
};

export default Video;