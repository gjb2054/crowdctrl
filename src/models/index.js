// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { VideoReport } = initSchema(schema);

export {
  VideoReport
};