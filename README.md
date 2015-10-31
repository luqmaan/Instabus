[**www.Instabus.org**](http://instabus.org)
====================

[![Slack](http://slack.open-austin.org/badge.svg)](Chat on the Open Austin #instabus Slack channel) Chat on the Open Austin **#instabus** Slack channel

#### [Realtime map of Austin's MetroRapid bus and MetroRail train](http://instabus.org)

[![](https://cloud.githubusercontent.com/assets/1275831/3210441/0128e4a2-eec1-11e3-8622-fc947f7c305c.png)](http://instabus.org)

##### Works on your desktop, your iPhone, and your Android device. Just go to [instabus.org](http://instabus.org)

![placeit](https://cloud.githubusercontent.com/assets/1275831/3565798/3078cb22-0ad3-11e4-8285-005d3c211766.jpg)


## FAQ

### What happened to MetroRappid?

MetroRappid has been renamed to Instabus.

MetroRappid for iOS has been replaced with Instabus.

MetroRappid for Android (winner of ATX Hack For Change) had problems working with the Google Maps API. We've chosen to move in the direction of open data, and now instead use OpenStreetMaps. This webapp replaces MetroRappid for Android.

### Why is the vehicle location out of date?

CapMetro only updates the vehicle location every 30-90 seconds. You should encourage them to provide more accurate realtime data.

## Contributing

~~We really need help making this app awesome. We use GitHub issues to track bugs, features, and ideas. Issues that we think are important/can use help are tagged as `help wanted`. You can filter by the `help wanted` tag: https://github.com/luqmaan/Instabus/issues?labels=help+wanted&state=open.~~

The code in this repo is too messy. Instabus needs to be rewritten from scratch. It also needs to be rewritten to work for other cities. We can do this by supporting the [OneBusAway REST API](http://developer.onebusaway.org/modules/onebusaway-application-modules/1.1.13/api/where/index.html) or [Transitime](http://www.transitime.org/). Unfortunately, Austin doesn't have a OneBusAway instance. So, we're slowly taking the necessary steps to run our own OneBusAway instance. See luqmaan/Instabus#210. 

We need help getting OneBusAway/Transitime running. If you have experience with **Java** come help. Join the #instabus or #transitime channel on the [Open Austin Slack](http://slack.open-austin.org). 

If you're interested in rewriting the Instabus webapp, contact on Slack. One attempt at rewriting Instabus has been started: https://github.com/luqmaan/instabus-react. But it is nowhere near complete.

**In the meantime, pull requests for bugs and UI changes to this repo are welcome.**

### Installation

Clone the repo and checkout the `dev` branch:

```
git clone git@github.com:luqmaan/Instabus.git
cd Instabus
git checkout -b dev origin/dev
```

Install dependencies through [npm](https://www.npmjs.org/) and [browserify](http://browserify.org/):

```
npm install
```

Serve the directory with [gulp](http://gulpjs.com/):

```
gulp serve
```

### Deployment

To deploy:

```
gulp clean
gulp build
gulp deploy
```

## Contributors

- https://github.com/luqmaan
- https://github.com/drmaples
- https://github.com/paulserraino
- https://github.com/ECatx
- https://github.com/fleeting
- Mayhaps you?

## License

GNU General Public License Version 3
