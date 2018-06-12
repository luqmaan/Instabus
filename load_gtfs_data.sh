#!/usr/bin/env bash

set -e
set -x

# Manually download the GTFS file from socrata https://data.texas.gov/capital-metro
# And copy pasta it to /tmp/capmetro_gtfs.zip

unzip -o /tmp/gtfs.zip -d /tmp/gtfs

echo "Generating db"

querycsv.py -f /tmp/gtfs.db -k \
  -i /tmp/gtfs/agency.txt \
  -i /tmp/gtfs/calendar_dates.txt \
  -i /tmp/gtfs/calendar.txt \
  -i /tmp/gtfs/fare_attributes.txt \
  -i /tmp/gtfs/fare_rules.txt \
  -i /tmp/gtfs/feed_info.txt \
  -i /tmp/gtfs/frequencies.txt \
  -i /tmp/gtfs/routes.txt \
  -i /tmp/gtfs/shapes.txt \
  -i /tmp/gtfs/stop_times.txt \
  -i /tmp/gtfs/stops.txt \
  -i /tmp/gtfs/transfers.txt \
  -i /tmp/gtfs/trips.txt \
   "select 1"

echo "Querying db"
python query_gtfs_data.py
