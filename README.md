# `prism`
A node CLI tool to send Google Lighthouse metrics to Datadog. 

## Setup
Create a `.env` file with the following format:
```
DATADOG_API_KEY=************
```
The Datadog API key can be retrieved by logging into Datadog and navigating to https://app.datadoghq.com/account/settings#api.

Then install node modules.
```bash
npm install
```

## Run
```bash
⏣  node index.js --help                                                                                
Options:
  --version  Show version number                                       [boolean]
  --url, -u  URL to audit                                    [string] [required]
  --app, -a  App name used to define the metric namspace     [string] [required]
  --tag, -t  Tag(s) to apply to all datadog metrics                      [array]
  --dry-run  Print metric data instead of sending it to datadog        [boolean]
  --help     Show help                                                 [boolean]

Examples:
    node index.js -u https://wuphf.com/ -a wuphf -t tagA:value -t tagB:value
```

## What's collected and sent to Datadog?

### Scores
```javascript
performance
accessibility
best-practices
seo
pwa
```

### Performance Metrics
```javascript
firstContentfulPaint
firstMeaningfulPaint
firstCPUIdle
interactive
speedIndex
estimatedInputLatency
totalBlockingTime
observedNavigationStart
observedNavigationStartTs
observedFirstPaint
observedFirstPaintTs
observedFirstContentfulPaint
observedFirstContentfulPaintTs
observedFirstMeaningfulPaint
observedFirstMeaningfulPaintTs
observedLargestContentfulPaint
observedLargestContentfulPaintTs
observedTraceEnd
observedTraceEndTs
observedLoad
observedLoadTs
observedDomContentLoaded
observedDomContentLoadedTs
observedFirstVisualChange
observedFirstVisualChangeTs
observedLastVisualChange
observedLastVisualChangeTs
observedSpeedIndex
observedSpeedIndexTs
maxPotentialFid
timeToFirstByte
bootupTime
unminifiedJavascript
```

*Note:* Reference `example-report.json` for help navigating the data structure that lighthouse uses for generated reports.

