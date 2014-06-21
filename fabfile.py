#!/usr/bin/python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import fabric.api


def serve():
    fabric.api.local("python -m SimpleHTTPServer 1234")
