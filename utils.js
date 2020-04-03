const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const setAsyncInterval = async (fn, interval) => {
  while (true) {
    await fn();
    await sleep(interval);
  }
};

const kebabToCamel = (str) => {
  return str
    .split('-')
    .map((word, index) => {
      if (index === 0) return word;
      const [first, ...rest] = word;
      return [first.toUpperCase(), ...rest].join('');
    })
    .join('');
};

module.exports = {
  sleep,
  setAsyncInterval,
  kebabToCamel,
};
