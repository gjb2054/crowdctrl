/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getVideoReport = /* GraphQL */ `
  query GetVideoReport($id: ID!) {
    getVideoReport(id: $id) {
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
export const listVideoReports = /* GraphQL */ `
  query ListVideoReports(
    $filter: ModelVideoReportFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listVideoReports(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncVideoReports = /* GraphQL */ `
  query SyncVideoReports(
    $filter: ModelVideoReportFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncVideoReports(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
