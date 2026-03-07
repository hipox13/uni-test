import { SetMetadata } from '@nestjs/common';

export const LOG_ACTIVITY_KEY = 'log_activity_feature';

/**
 * Marks a controller method for automatic activity logging.
 * @param feature - The feature name recorded in the log (e.g. 'roles', 'pages').
 */
export const LogActivity = (feature: string) =>
  SetMetadata(LOG_ACTIVITY_KEY, feature);
