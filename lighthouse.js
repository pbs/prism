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
  const launcherOptions = {
    chromeFlags: headless ? ['--headless'] : [],
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
