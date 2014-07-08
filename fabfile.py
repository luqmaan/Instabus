#!/usr/bin/python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import json
import tempfile
import sqlite3
from collections import defaultdict

import requests
import fabric.api


# only routes with realtime data
ROUTE_IDS = {
    801: ('MetroRapid', 'Bus'),
    550: ('MetroRail', 'Train'),
}

GTFS_DOWNLOAD_FILE = os.path.join(tempfile.gettempdir(), 'capmetro_gtfs.zip')
GTFS_DB = os.path.join(tempfile.gettempdir(), 'capmetro_gtfs_data.db')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
DATA_VERSION_FILE = os.path.join(DATA_DIR, 'data_version.txt')


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'


def serve():
    fabric.api.local("twistd -n web -p 1234 --path .")


def fetch_gtfs_data():
    print bcolors.HEADER
    print 'fetching gtfs data....'
    print bcolors.ENDC
    r = requests.get('http://www.gtfs-data-exchange.com/agency/capital-metro/latest.zip', stream=True)
    assert r.ok, 'problem fetching data. status_code={}'.format(r.status_code)

    # looks like 'capital-metro_20140609_0109.zip'
    with open(DATA_VERSION_FILE, 'wb') as f:
        data_version = os.path.splitext(os.path.basename(r.url))[0].replace('capital-metro_', '')
        f.write(data_version + '\n')

    with open(GTFS_DOWNLOAD_FILE, 'wb') as f:
        for chunk in r.iter_content(1024):
            f.write(chunk)
    print 'saved to {}'.format(GTFS_DOWNLOAD_FILE)


def _save_route_data(curr):
    sql = '''
        SELECT DISTINCT route_id, direction_id, trip_headsign
        FROM trips
        WHERE route_id IN ({})
        ORDER BY route_id DESC, trip_headsign ASC
    '''.format(','.join('?' for _ in ROUTE_IDS))
    curr.execute(sql, ROUTE_IDS.keys())

    data = []
    for row in curr:
        route_id, direction_id, direction = int(row[0]), int(row[1]), row[2].title().replace('bound', '')
        route_name, vehicle_type = ROUTE_IDS[route_id]
        data.append({
            'id': route_id,
            'direction': direction_id,
            'name': '{} {} {}'.format(route_id, route_name, direction),
            'vehicle_type': vehicle_type,
        })

    filename = os.path.join(DATA_DIR, 'routes.json')
    print 'writing ROUTE data to {}'.format(filename)
    with open(filename, 'wb') as f:
        f.write(json.dumps(data) + '\n')


def _get_shape_data(curr):
    sql = '''
        SELECT shapes.shape_id, count(*) as num_shapes, trips.direction_id, trips.route_id, trips.*
        FROM
            shapes,
            (
                SELECT *
                FROM trips, calendar
                WHERE calendar.service_id = trips.service_id and trips.route_id in ({})
                GROUP BY trips.shape_id
            ) as trips
        WHERE shapes.shape_id = trips.shape_id
        GROUP BY shapes.shape_id
        ORDER BY num_shapes DESC
    '''.format(','.join('?' for _ in ROUTE_IDS))
    curr.execute(sql, ROUTE_IDS.keys())

    biggest_data_by_route = {}
    for row in curr:
        shape_id, num_shapes, direction_id, route_id = row[0], int(row[1]), int(row[2]), row[3]
        key = (route_id, direction_id)
        value = {'num_shapes': num_shapes, 'shape_id': shape_id}
        if key in biggest_data_by_route:
            if num_shapes > biggest_data_by_route[key]['num_shapes']:
                biggest_data_by_route[key] = value
        else:
            biggest_data_by_route[key] = value

    return biggest_data_by_route


def _save_shape_data(curr, shape_data):
    for (route_id, direction_id), val in shape_data.items():
        sql = '''
            SELECT *
            FROM shapes
            WHERE shape_id = ?
            ORDER BY shape_id
        '''
        curr.execute(sql, [val['shape_id']])

        data = []
        for (shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled) in curr:
            data.append({
                'shape_id': shape_id,
                'shape_pt_lat': shape_pt_lat,
                'shape_pt_lon': shape_pt_lon,
                'shape_pt_sequence': shape_pt_sequence,
                'shape_dist_traveled': shape_dist_traveled,
            })

        filename = os.path.join(DATA_DIR, 'shapes_{}_{}.json'.format(route_id, direction_id))
        print 'writing SHAPE data to {}'.format(filename)
        with open(filename, 'wb') as f:
            f.write(json.dumps(data) + '\n')


def _save_stop_data(curr):
    sql = '''
        SELECT
            trips.route_id,
            trips.direction_id,
            stops.stop_id,
            stops.stop_code,
            stops.stop_name,
            stops.stop_desc,
            stops.stop_lat,
            stops.stop_lon,
            stops.zone_id,
            stops.stop_url,
            stops.location_type,
            stops.parent_station,
            stops.stop_timezone,
            stops.wheelchair_boarding,
            stops.platform_code,
            stop_times.stop_sequence
        FROM
            stop_times, trips, stops
        WHERE
            trips.route_id in ({})
            AND trips.trip_id = stop_times.trip_id
            AND stop_times.stop_id = stops.stop_id
        GROUP BY
            trips.route_id,
            trips.direction_id,
            stops.stop_id,
            stops.stop_code,
            stops.stop_name,
            stops.stop_desc,
            stops.stop_lat,
            stops.stop_lon,
            stops.zone_id,
            stops.stop_url,
            stops.location_type,
            stops.parent_station,
            stops.stop_timezone,
            stops.wheelchair_boarding,
            stops.platform_code,
            stop_times.stop_sequence
        ORDER BY stop_times.stop_sequence
    '''.format(','.join('?' for _ in ROUTE_IDS))
    curr.execute(sql, ROUTE_IDS.keys())

    data_by_stops = defaultdict(list)
    for (route_id, direction_id, stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding, platform_code, stop_sequence) in curr:
        data_by_stops[(route_id, direction_id)].append({
            'route_id': route_id,
            'direction_id': direction_id,
            'stop_id': stop_id,
            'stop_code': stop_code,
            'stop_name': stop_name,
            'stop_desc': stop_desc,
            'stop_lat': stop_lat,
            'stop_lon': stop_lon,
            'zone_id': zone_id,
            'stop_url': stop_url,
            'location_type': location_type,
            'parent_station': parent_station,
            'stop_timezone': stop_timezone,
            'wheelchair_boarding': wheelchair_boarding,
            'platform_code': platform_code,
            'stop_sequence': stop_sequence,
        })

    for (route_id, direction_id), data in data_by_stops.items():
        filename = os.path.join(DATA_DIR, 'stops_{}_{}.json'.format(route_id, direction_id))
        print 'writing STOP data to {}'.format(filename)
        with open(filename, 'wb') as f:
            f.write(json.dumps(data) + '\n')


def parse_gtfs_data(force_refetch=True):
    if int(force_refetch):
        fetch_gtfs_data()

    print bcolors.HEADER
    print 'loading gtfs data into db ({})...'.format(GTFS_DB)
    print bcolors.ENDC
    fabric.api.local('gtfsdb-load --database_url sqlite:///{} {}'.format(GTFS_DB, GTFS_DOWNLOAD_FILE))

    with sqlite3.connect(GTFS_DB) as conn:
        curr = conn.cursor()
        _save_route_data(curr)
        shape_data = _get_shape_data(curr)
        _save_shape_data(curr, shape_data)
        _save_stop_data(curr)


def deploy():
    parse_gtfs_data()
    fabric.api.local('npm install -g requirejs@~2.1.14')
    fabric.api.local('r.js -o js/almond.build.js')
    print bcolors.WARNING
    print 'REMEMBER: Toggle the <!-- production --> / <!-- development --> script tags in index.html'
    print bcolors.ENDC

