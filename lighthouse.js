import lighthouse from 'lighthouse';
import * as launcher from 'chrome-launcher';
import {kebabToCamel} from './utils.js';

/* Not all metrics that we want to track exist in the "metrics" audit field so we can
 * specify additional audit keys that we want to pull out of the lighthouse audit JSON.
 * */
const additionalAuditKeys = ['max-potential-fid', 'server-response-time', 'bootup-time', 'unminified-javascript'];

const categoryScoreKeys = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'];

const launchChrome = async ({headless} = {}) => {
  /* Adding the --no-sandbox flag is a way to have this run smoothly in a container.
   * Sandboxing acts as another barrier around the JS environment that will prevent any
   * harm from being done if malicious code were to break out of JS runtime environment.
   * Docker has its own security measures that mitigate rogue code from executing outside
   * of the container and we are only ever hitting our own trusted URLs so it's safe to
   * forgo the chrome sandboxing.
   *
   * https://github.com/GoogleChrome/lighthouse-ci/tree/master/docs/recipes/docker-client#--no-sandbox-issues-explained
   * */
  const launcherOptions = {
    chromeFlags: headless ? ['--headless', '--no-sandbox'] : [],
  };
  return launcher.launch(launcherOptions);
};

const runLighthouse = async (url, chrome) => {
  const options = {
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    throttling: {
      cpuSlowdownMultiplier: 4,
    },
  };
  const results = await lighthouse(url, options);

  let baseMetrics = [];
  if (results.lhr.audits.metrics?.details?.items?.[0]) {
    const baseMetricObj = results.lhr.audits.metrics.details.items[0];
    baseMetrics = Object.entries(baseMetricObj).map(([name, value]) => ({name, value}));
  }

  // Check if each audit key exists before trying to destructure it
  const additionalMetrics = additionalAuditKeys
    .filter(key => results.lhr.audits[key])
    .map((key) => {
      const audit = results.lhr.audits[key];
      // Make sure id and numericValue exist, use fallbacks if needed
      return {
        name: kebabToCamel(audit.id || key),
        value: audit.numericValue !== undefined ? audit.numericValue : null
      };
    });

  const categoryScores = categoryScoreKeys
    .filter(key => results.lhr.categories[key])
    .map((key) => {
      const category = results.lhr.categories[key];
      return {
        name: `categoryScore.${kebabToCamel(category.id || key)}`,
        value: category.score
      };
    });

  return [...baseMetrics, ...additionalMetrics, ...categoryScores];
};

export {
  launchChrome,
  runLighthouse,
};
