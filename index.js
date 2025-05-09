
import {launchChrome, runLighthouse} from './lighthouse.js';
import {collectCompleteMetrics} from './retry.js';
import {generateMetricsPayload, sendMetricsToDatadog} from './datadog.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const args = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    description: 'URL to audit',
    type: 'string',
    demandOption: true,
  })
  .option('app', {
    alias: 'a',
    description: 'App name used to define the metric namespace',
    type: 'string',
    demandOption: true,
  })
  .option('tag', {
    alias: 't',
    description: 'Tag(s) to apply to all datadog metrics',
    type: 'array',
  })
  .option('dry-run', {
    description: 'Print metric data instead of sending it to datadog',
    type: 'boolean',
  })
  .option('retry', {
    description: 'Retry until a set of metrics is successfully captured',
    type: 'boolean',
    //TODO add a flag for metrics user wants to collect using retry
  })
  .option('debug', {
    description: 'Enable debug logging',
    type: 'boolean',
    default: false,
  })
  .example('', 'node index.js -u https://wuphf.com/ -a wuphf -t tagA:value -t tagB:value')
  .help()
  .parse();

(async () => {
  try {
    const {url, app, tag: tags, dryRun, retry} = args;

    if (!dryRun && !process.env.DATADOG_API_KEY) {
      /* An API key is required when actually sending to Datadog
       * so validate and fail early before doing any processing */
      console.error('Error: An API key is required to send metrics to Datadog.');
      return;
    }

    const chrome = await launchChrome({headless: true});
    const metrics = await (retry
      ? collectCompleteMetrics(url, chrome)
      : runLighthouse(url, chrome));
    await chrome.kill();

    const payload = generateMetricsPayload(app, metrics, tags);
    if (dryRun) {
      /* The datadog client uses nested arrays which do not print well so to
       * make the table a little more human readable, we extract the metric value
       * and timestamp into their own fields */
      const breakdown = payload.map((metric) => {
        let [timestamp, value] = metric.points[0];
        timestamp = new Date(timestamp * 1000);
        return {...metric, timestamp, value};
      });
      console.table(breakdown, ['metric', 'value', 'timestamp', 'tags']);
    } else {
      await sendMetricsToDatadog(payload);
    }
  } catch (error) {
    console.error(error);
  }
})();

export {args};
