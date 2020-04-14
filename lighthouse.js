const lighthouse = require('lighthouse');
const launcher = require('chrome-launcher');
const {kebabToCamel} = require('./utils');

const auditKeys = [
  'first-contentful-paint',
  'first-meaningful-paint',
  'speed-index',
  'estimated-input-latency',
  'total-blocking-time',
  'max-potential-fid',
  'time-to-first-byte',
  'first-cpu-idle',
  'interactive',
  'bootup-time',
  // 'diagnostics',
  // 'metrics',
  'unminified-javascript',
];

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
  const metrics = auditKeys.map((key) => {
    const {id, numericValue} = results.lhr.audits[key];
    return {name: kebabToCamel(id), value: numericValue};
  });
  return metrics;
};

module.exports = {
  launchChrome,
  runLighthouse,
};
