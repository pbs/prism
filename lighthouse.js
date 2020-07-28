const lighthouse = require('lighthouse');
const launcher = require('chrome-launcher');
const {kebabToCamel} = require('./utils');

/* Not all metrics that we want to track exist in the "metrics" audit field so we can
 * specify additional audit keys that we want to pull out of the lighthouse audit JSON.
 * */
const additionalAuditKeys = ['max-potential-fid', 'time-to-first-byte', 'bootup-time', 'unminified-javascript'];

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
    onlyCatagories: ['performance'],
    throttling: {
      cpuSlowdownMultiplier: 4,
    },
  };
  const results = await lighthouse(url, options);

  const baseMetricObj = results.lhr.audits.metrics.details.items[0];
  const baseMetrics = Object.entries(baseMetricObj).map(([name, value]) => ({name, value}));

  const additionalMetrics = additionalAuditKeys.map((key) => {
    const {id, numericValue} = results.lhr.audits[key];
    return {name: kebabToCamel(id), value: numericValue};
  });

  const categoryScores = categoryScoreKeys.map((key) => {
    const {id, score} = results.lhr.categories[key];
    return {name: `categoryScore.${kebabToCamel(id)}`, value: score};
  });
  return [...baseMetrics, ...additionalMetrics, ...categoryScores];
};

module.exports = {
  launchChrome,
  runLighthouse,
};
