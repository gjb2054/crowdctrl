/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateVideoReport = /* GraphQL */ `
  subscription OnCreateVideoReport(
    $filter: ModelSubscriptionVideoReportFilterInput
    $owner: String
  ) {
    onCreateVideoReport(filter: $filter, owner: $owner) {
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
export const onUpdateVideoReport = /* GraphQL */ `
  subscription OnUpdateVideoReport(
    $filter: ModelSubscriptionVideoReportFilterInput
    $owner: String
  ) {
    onUpdateVideoReport(filter: $filter, owner: $owner) {
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
export const onDeleteVideoReport = /* GraphQL */ `
  subscription OnDeleteVideoReport(
    $filter: ModelSubscriptionVideoReportFilterInput
    $owner: String
  ) {
    onDeleteVideoReport(filter: $filter, owner: $owner) {
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
