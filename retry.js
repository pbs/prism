import { runLighthouse } from './lighthouse.js';
import { args } from './index.js';

// metrics in the pbs-prod-lighthouse DataDog dashboard (https://p.datadoghq.com/sb/2wDxt_-83b2c08d23c8b778c497c2aeb3a4ae15)
const DATADOG_METRICS = [
  'speedIndex',
  'firstContentfulPaint',
  'largestContentfulPaint',
  'observedLargestContentfulPaint',
  'categoryScore.accessibility',
  'categoryScore.bestPractices',
  'categoryScore.performance'
];

const collectCompleteMetrics = async (url, chrome) => {
  const startTime = Date.now();
  const timeoutMs = 300 * 1000; // 5 minutes
  const sleepMs = 6 * 1000; // 6 seconds between attempts

  // Initialize the completePayload object to track metric collection
  const completePayload = {};

  console.log(`Starting lighthouse metrics collection for ${url}`);
  let attemptCount = 0;

  while (Date.now() - startTime < timeoutMs) {
    try {
      attemptCount++;
      console.log(`Attempt ${attemptCount} - ${Math.round((Date.now() - startTime))}ms elapsed`);

      // Get metrics from lighthouse
      const metrics = await runLighthouse(url, chrome);

      // Filter metrics to only those we care about
      const relevantMetrics = metrics.filter(metric =>
        DATADOG_METRICS.includes(metric.name)
      );

      // Update the completePayload with the filtered metrics
      relevantMetrics.forEach(metric => {
        // Initialize this metric in payload if needed
        if (!completePayload[metric.name]) {
          completePayload[metric.name] = {
            measured: false,
            metricArr: []
          };
        }

        //debug: print the metric name and value
        if (args.debug) {
          console.log(`In collectCompleteMetrics loop; Metric: ${metric.name}, Value: ${metric.value}`);
        }

        // Add current measurement to array
        completePayload[metric.name].metricArr.push(metric);

        // Mark as measured if we have a numeric value
        if (metric.value !== null && metric.value !== undefined) {
          completePayload[metric.name].measured = true;
        }
      });

      // Check if all metrics have been measured
      const allMetricsMeasured = Object.values(completePayload)
        .every(metricAttempt => metricAttempt.measured);

      if (allMetricsMeasured) {
        console.log('All metrics successfully measured!');
        break;
      } else {
        // Calculate how many metrics still need values
        const unmeasured = Object.values(completePayload)
          .filter(m => !m.measured).length;
        console.log(`Still waiting for ${unmeasured} metrics to be measured`);
      }
    } catch (error) {
      console.error(`Error during lighthouse run: ${error.message}`);
    }

    // Wait before the next attempt (unless we've hit the timeout)
    if (Date.now() - startTime + sleepMs < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, sleepMs));
    }
  }

  // Process the completePayload into the format needed for DataDog
  return processCompletePayload(completePayload);
};

const processCompletePayload = (completePayload) => {
  /**
   * Processes the completePayload object, taking an average of all metrics
   * @param {Object} completePayload - Object containing metrics with their measurement status and values
   * @returns {Array} Array of processed metrics with aggregated values
   */
  const rawLighthousePayload = [];

  for (const metricName in completePayload) {
    const metricAttempt = completePayload[metricName];



    const metricValues = metricAttempt.metricArr
      .map(m => m.value)
      .filter(value => value !== null && value !== undefined);

    let aggregatedValue = null;
    if (metricValues.length > 0) {
      aggregatedValue = metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
    }

    if (args.debug) {
      console.log(`In processCompletePayload; Metric: ${metricName}, Value: ${aggregatedValue}`);
    }

    rawLighthousePayload.push({
      name: metricName,
      value: aggregatedValue
    });
  }

  return rawLighthousePayload;
};

export { collectCompleteMetrics, processCompletePayload };