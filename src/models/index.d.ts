import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";





type EagerVideoReport = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<VideoReport, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userEmail: string;
  readonly peopleCount?: (number | null)[] | null;
  readonly tag?: string | null;
  readonly videoUrls?: (string | null)[] | null;
  readonly streamUrl?: string | null;
  readonly topicArn?: string | null;
  readonly jobIds?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyVideoReport = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<VideoReport, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly userEmail: string;
  readonly peopleCount?: (number | null)[] | null;
  readonly tag?: string | null;
  readonly videoUrls?: (string | null)[] | null;
  readonly streamUrl?: string | null;
  readonly topicArn?: string | null;
  readonly jobIds?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type VideoReport = LazyLoading extends LazyLoadingDisabled ? EagerVideoReport : LazyVideoReport

export declare const VideoReport: (new (init: ModelInit<VideoReport>) => VideoReport) & {
  copyOf(source: VideoReport, mutator: (draft: MutableModel<VideoReport>) => MutableModel<VideoReport> | void): VideoReport;
}