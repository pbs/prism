// https://brettlangdon.github.io/node-dogapi/
import dogapi from 'dogapi';

dogapi.initialize({
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
  const metricsWithValues = payload.filter((data) => ![undefined, null].includes(data.points[0][1]));
  return new Promise((resolve, reject) => {
    try {
      dogapi.metric.send_all(metricsWithValues, (resp) => resolve(resp));
    } catch (error) {
      reject(error);
    }
  });
};

export {
  sendMetricsToDatadog,
  generateMetricsPayload
};
