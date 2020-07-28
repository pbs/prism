// https://brettlangdon.github.io/node-dogapi/
const dapi = require('dogapi');

dapi.initialize({
  api_key: process.env.DATADOG_API_KEY,
});

const generateMetricsPayload = (app, lhMetrics, tags = []) => {
  const now = parseInt(new Date().getTime() / 1000);
  return lhMetrics.map((metric) => ({
    metric: `${app}.lighthouse.${metric.name}`,
    points: [[now, metric.value]],
    tags,
  }));
};

const sendMetricsToDatadog = async (payload) => {
  // Only send metrics with values
  const metricsWithValues = payload.filter((data) => Boolean(data.points[1]));
  return new Promise((resolve, reject) => {
    try {
      dapi.metric.send_all(metricsWithValues, (resp) => resolve(resp));
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {sendMetricsToDatadog, generateMetricsPayload};
