#!/usr/bin/python
# -*- coding: utf-8 -*-

# This script is used to update the JSON files in the data folder.
# It downloads the GTFS data from CapMetro, converts it to a SQLite database, and performs some queries on it to generate the JSON files.

from __future__ import unicode_literals

import os
import json
import tempfile
import sqlite3
import logging
from collections import defaultdict

import arrow
import gtfsdb
import futures
import requests
from lxml import etree
from gtfsdb.api import database_load

GTFS_DOWNLOAD_FILE = os.path.join(tempfile.gettempdir(), 'capmetro_gtfs.zip')
GTFS_DB = os.path.join(tempfile.gettempdir(), 'capmetro_gtfs_data.db')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
DATA_VERSION_FILE = os.path.join(DATA_DIR, 'data_version.txt')


def fetch_gtfs_data():
    logger.info('fetching gtfs data....')
    gtfs_url = 'https://data.texas.gov/download/r4v4-vz24/application/zip'
    r = requests.get(gtfs_url, stream=True)
    assert r.ok, 'problem fetching data. status_code={}'.format(r.status_code)

    # looks like 'capital-metro_20140609_0109.zip'
    with open(DATA_VERSION_FILE, 'wb') as f:
        f.write('{}\n{}\n'.format(r.url, arrow.now()))

    with open(GTFS_DOWNLOAD_FILE, 'wb') as f:
        for chunk in r.iter_content(1024):
            f.write(chunk)
    logger.info('saved to {}'.format(GTFS_DOWNLOAD_FILE))


def _valid_stop_id(stop_id):
    no_runs_code = 'soap:15034'
    nextbus_url = 'http://www.capmetro.org/planner/s_nextbus2.asp'
    r = requests.get(nextbus_url, params={'stopid': stop_id})
    root = etree.fromstring(r.text.encode('utf-8'))

    error = root.findtext('soap:Body/soap:Fault/faultcode', namespaces={'soap': 'http://schemas.xmlsoap.org/soap/envelope/'})
    valid = error is None or error == no_runs_code
    return valid, stop_id


def _get_valid_stops(curr):
    sql = '''
        SELECT DISTINCT stop_id
        FROM stops
    '''
    curr.execute(sql)
    stops = [stop_id[0] for stop_id in curr]
    with futures.ThreadPoolExecutor(max_workers=5) as executor:
        futs = [executor.submit(_valid_stop_id, stop_id) for stop_id in stops]
        done, _ = futures.wait(futs, timeout=90)
        futs = [fut.result() for fut in futs]
        return [stop_id for (valid, stop_id) in futs if valid]


def _get_route_types(curr):
    route_types = {}

    sql = '''
        SELECT route_type, route_type_name
        FROM route_type
    '''
    curr.execute(sql)

    for row in curr:
        route_type = int(row[0])
        route_type_name = row[1]

        route_types[route_type] = route_type_name

    return route_types


def _get_routes_for_types(curr, route_types):
    routes = {}

    sql = '''
        SELECT route_id, route_long_name, route_type
        FROM routes
    '''
    curr.execute(sql)

    for row in curr:
        route_id = int(row[0])
        route_long_name = row[1]
        route_type = int(row[2])
        routes[route_id] = {
            'route_id': route_id,
            'name': route_long_name,
            'route_type': route_types[route_type],
            'directions': [],
        }

    return routes


def _get_directions_for_routes(curr, routes):
    sql = '''
        SELECT DISTINCT route_id, direction_id, trip_headsign
        FROM trips
        ORDER BY route_id DESC, trip_headsign ASC
    '''
    curr.execute(sql)

    for row in curr:
        route_id = int(row[0])
        direction_id = int(row[1])
        headsign = row[2].title()
        direction = {
            'direction_id': direction_id,
            'headsign': headsign,
        }
        routes[route_id]['directions'].append(direction)

    return routes


def _save_route_data(curr):
    route_types = _get_route_types(curr)
    routes = _get_routes_for_types(curr, route_types)
    directions = _get_directions_for_routes(curr, routes)

    data = sorted(directions.values(), key=lambda x: x['route_id'])

    filename = os.path.join(DATA_DIR, 'routes.json')
    logger.info('writing ROUTE data to {}'.format(filename))
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
                WHERE calendar.service_id = trips.service_id
                GROUP BY trips.shape_id
            ) as trips
        WHERE shapes.shape_id = trips.shape_id
        GROUP BY shapes.shape_id
        ORDER BY num_shapes DESC
    '''
    curr.execute(sql)

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
        logger.info('writing SHAPE data to {}'.format(filename))
        with open(filename, 'wb') as f:
            f.write(json.dumps(data) + '\n')


def _save_stop_data(curr, valid_stops):
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
        WHERE trips.trip_id = stop_times.trip_id
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
    '''
    curr.execute(sql)

    data_by_stops = defaultdict(list)
    for (route_id, direction_id, stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, stop_timezone, wheelchair_boarding, platform_code, stop_sequence) in curr:
        if stop_id in valid_stops:
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
        logger.info('writing STOP data to {}'.format(filename))
        with open(filename, 'wb') as f:
            f.write(json.dumps(data) + '\n')


def parse_gtfs_data():
    logger.info('loading gtfs data into db ({})...'.format(GTFS_DB))
    database_load(
        filename=GTFS_DOWNLOAD_FILE,
        batch_size=gtfsdb.config.DEFAULT_BATCH_SIZE,
        schema=gtfsdb.config.DEFAULT_SCHEMA,
        is_geospatial=gtfsdb.config.DEFAULT_IS_GEOSPATIAL,
        tables=None,
        url='sqlite:///{}'.format(GTFS_DB),
    )

    with sqlite3.connect(GTFS_DB) as conn:
        curr = conn.cursor()
        _save_route_data(curr)
        shape_data = _get_shape_data(curr)
        _save_shape_data(curr, shape_data)
        valid_stops = _get_valid_stops(curr)
        _save_stop_data(curr, valid_stops)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)-15s [%(levelname)s] %(message)s')
    logger = logging.getLogger(__name__)

    fetch_gtfs_data()
    parse_gtfs_data()
