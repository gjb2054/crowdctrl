/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createVideoReport = /* GraphQL */ `
  mutation CreateVideoReport(
    $input: CreateVideoReportInput!
    $condition: ModelVideoReportConditionInput
  ) {
    createVideoReport(input: $input, condition: $condition) {
      userEmail
      peopleCount
      tag
      videoUrls
      streamUrl
      topicArn
      jobIds
      id
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateVideoReport = /* GraphQL */ `
  mutation UpdateVideoReport(
    $input: UpdateVideoReportInput!
    $condition: ModelVideoReportConditionInput
  ) {
    updateVideoReport(input: $input, condition: $condition) {
      userEmail
      peopleCount
      tag
      videoUrls
      streamUrl
      topicArn
      jobIds
      id
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteVideoReport = /* GraphQL */ `
  mutation DeleteVideoReport(
    $input: DeleteVideoReportInput!
    $condition: ModelVideoReportConditionInput
  ) {
    deleteVideoReport(input: $input, condition: $condition) {
      userEmail
      peopleCount
      tag
      videoUrls
      streamUrl
      topicArn
      jobIds
      id
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
