require('dotenv').config();
const {launchChrome, runLighthouse} = require('./lighthouse');
const {collectCompleteMetrics} =  require('./retry');
const {generateMetricsPayload, sendMetricsToDatadog} = require('./datadog');

const args = require('yargs')
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
  .example('', 'node index.js -u https://wuphf.com/ -a wuphf -t tagA:value -t tagB:value')
  .help().argv;

(async () => {
  try {
    const {url, app, tag: tags, dryRun} = args;

    if (!dryRun && !process.env.DATADOG_API_KEY) {
      /* An API key is required when actually sending to Datadog
       * so validate and fail early before doing any processing */
      console.error('Error: An API key is required to send metrics to Datadog.');
      return;
    }

    const chrome = await launchChrome({headless: true});
    const metrics = await collectCompleteMetrics(url, chrome);
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
