:warning: Instabus is deprecated.

Thank you for your support and for advocating to CapMetro the need for realtime transit data. Thanks to your help, CapMetro noticed Instabus and invited us to work with them to publish realtime data. CapMetro now publishes [reliable GTFS-realtime feeds](https://data.texas.gov/capital-metro), which means more than just the CapMetro app and Instabus can show realtime data for Austin.

Try out [Transit](https://transitapp.com/), possibly the best realtime transit app that works in Austin. For more transit apps  take a look at [awesome-transit](https://github.com/luqmaan/awesome-transit).

------------

[**www.Instabus.org**](http://instabus.org)
====================

#### [Realtime map of Austin's MetroRapid bus and MetroRail train](http://instabus.org)

![](https://cloud.githubusercontent.com/assets/1275831/3210441/0128e4a2-eec1-11e3-8622-fc947f7c305c.png)  

##### Works on your desktop, your iPhone, and your Android device. Just go to [instabus.org](http://instabus.org)

![placeit](https://cloud.githubusercontent.com/assets/1275831/3565798/3078cb22-0ad3-11e4-8285-005d3c211766.jpg)

<img src="https://user-images.githubusercontent.com/1275831/28545957-98880cae-708e-11e7-9848-ae6d610c0107.png" width="400">  <img src="https://user-images.githubusercontent.com/1275831/28545972-ac7bbd14-708e-11e7-8e1a-16ff630c4a66.png" width="400">


## FAQ

### What happened to the rewrite you started in 2016?

We got distracted by trying to make the map animations awesome and the code beautiful. You can view the work we started at https://github.com/open-austin/instabus.

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

### Updating GTFS Data

```
./load_gtfs_data.sh
```

## Contributors

Instabus has gone through many iterations and has had many contributors. Some get credit in the [Contributors graph](https://github.com/luqmaan/Instabus/graphs/contributors), and some don't.

- https://github.com/luqmaan - :hankey:
- https://github.com/drmaples - :rooster: The inspiration behind making Instabus a webapp instead of a native app. Wrote 50% of the Instabus webapp with @luqmaan early in the morning before work.
- https://github.com/scascketta - The name Instabus, the Go proxy, many bugfixes, sanity, plenty of testing, beans, and much more.
- https://github.com/walkeriniraq - So much help with Transitime and figuring out Java
- https://github.com/paulserraino - Map usability and CSS minification
- https://github.com/ECatx - Accessibility contributions
- https://github.com/jpmensching - :star2: Added favorites
- https://github.com/sethgho - Created MetroRappid for Android, MetroRappid for iOS contributions
- https://github.com/johntyree - MetroRappid for Android contributions, help with arrival time prediction algorithms , and much more
- https://github.com/fleeting - Default map location and README contributions
- https://github.com/Caskman - MetroRappid for Android contributions, beans, Android theme color

## License

GNU General Public License Version 3
