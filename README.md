[**www.MetroRappid.com**](http://metrorappid.com)
====================

#### [Realtime map of Austin's MetroRapid bus and MetroRail train](http://metrorappid.com)

[![](https://cloud.githubusercontent.com/assets/1275831/3210441/0128e4a2-eec1-11e3-8622-fc947f7c305c.png)](http://metrorappid.com)


##### Watch the bus/train move in realtime on a map. Also see how fast (or slow) it is moving. This bus between Chinatown and Techridge is moving South at 39 mph.

![realtime-bus](https://cloud.githubusercontent.com/assets/1275831/3565764/29f44d6a-0ad0-11e4-9bc0-aa39e50b77a3.jpg)

##### See the next few arrivals at a glance.

![arrivals-at-a-glance](https://cloud.githubusercontent.com/assets/1275831/3565763/29f3796c-0ad0-11e4-9508-0b03d1fcd1b8.jpg)

##### Works on your desktop, your iPhone, and your Android device. Just go to [metrorappid.com](http://metrorappid.com)

![placeit](https://cloud.githubusercontent.com/assets/1275831/3565798/3078cb22-0ad3-11e4-8285-005d3c211766.jpg)

## Routes

CapMetro provides realtime data for these routes:

- 801 North MetroRapid
- 801 South MetroRapid
- 550 North MetroRail
- 550 South MetroRail

## Problemo

- People don't ride the bus because it can seem unreliable: buses arrive anytime from 10 minutes before their scheduled time to 20 minutes after
- The solution to that is real-time data
- But if the real-time data is hard to access, people won't use it
- The MetroRapid (801) and MetroRail (550) routes have real-time data
- Only CapMetro's official app have access to that real-time data
- But, CapMetro's app is **hard** to use. See [CapMetroApp: When should I take the bus home?](https://github.com/sethgho/MetroRappidAndroid/wiki/CapMetro-App---When-should-I-take-the-bus-home)


## Solution

We reverse engineered CapMetro's app to find out how they were getting real-time data. Then we [documented the hidden/secret CapMetro API](https://github.com/luqmaan/MetroRappid/wiki/The-CapMetro-API).
We then used that API and built an Android app that shows real-time arrivals for MetroRapid and MetroRail, really quickly.

Step 1. Select A Route And Direction

![Select A Route And Direction]()


Step 2. MetroRappid automatically finds the nearest stop and vehicle

![View the closest stop and vehicle]()

Step 3. Get on the bus

## FAQ

### What happened to MetroRappid for iOS and MetroRappid for Android?

### Why don't I see any buses or trains?

### Why is the bus location out of date?

## Team

- https://github.com/luqmaan
- https://github.com/drmaples
- https://github.com/sethgho
- https://github.com/scasketta
- https://github.com/johntyree
- https://github.com/caskman

## License

GNU GPL
