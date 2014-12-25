var arrivalsForStop = {
    "query": {
        "count": 1,
        "created": "2014-12-23T01:56:56Z",
        "lang": "en-US",
        "results": {
            "Envelope": {
                "Body": {
                    "SchedulenearbyResponse": {
                        "Atstop": {
                            "Area": "Austin",
                            "Atisstopid": "58054",
                            "Description": "DOMAIN STATION",
                            "Heading": "NB",
                            "Lat": "30.399849",
                            "Long": "-97.720451",
                            "Service": {
                                "Direction": "S",
                                "Operator": "CM",
                                "Publicoperator": "CM",
                                "Publicroute": "803",
                                "Route": "803",
                                "Routetype": "K",
                                "Servicetype": "0",
                                "Sign": "803 WESTGATE",
                                "Status": "L",
                                "Times": "07:20 PM, 07:40 PM, 08:00 PM, 08:20 PM, 08:40 PM",
                                "Tripinfo": [
                                    {
                                        "Block": "803-11",
                                        "Exception": "N",
                                        "Skedtripid": "\n\t\t\t\t\t\t",
                                        "Tripid": "60792-61",
                                        "Triptime": "07:20 PM"
                                    },
                                    {
                                        "Block": "803-04",
                                        "Exception": "N",
                                        "Skedtripid": "\n\t\t\t\t\t\t",
                                        "Tripid": "60792-62",
                                        "Triptime": "07:40 PM"
                                    },
                                    {
                                        "Block": "803-06",
                                        "Exception": "N",
                                        "Skedtripid": "\n\t\t\t\t\t\t",
                                        "Tripid": "60792-63",
                                        "Triptime": "08:00 PM"
                                    },
                                    {
                                        "Block": "803-10",
                                        "Exception": "N",
                                        "Skedtripid": "\n\t\t\t\t\t\t",
                                        "Tripid": "60792-64",
                                        "Triptime": "08:20 PM"
                                    },
                                    {
                                        "Block": "803-02",
                                        "Exception": "N",
                                        "Skedtripid": "\n\t\t\t\t\t\t",
                                        "Tripid": "60792-65",
                                        "Triptime": "08:40 PM"
                                    }
                                ]
                            },
                            "Side": "Near",
                            "Stopid": "5919",
                            "Stopposition": "N",
                            "Stopstatustype": "N",
                            "Walkdist": "0.00"
                        },
                        "Copyright": "XML schema Copyright (c) 2003-2013 Trapeze Software ULC, its subsidiaries and affiliates.  All rights reserved.",
                        "Host": "cmtaatisweb2",
                        "Input": {
                            "Atisstopid": "0",
                            "Date": "12/22/2014",
                            "Landmarkid": null,
                            "Locationlat": "0",
                            "Locationlong": "0",
                            "Locationtext": "postedid 5919",
                            "Route": "803",
                            "Stopid": "5919",
                            "Time": "07:56 PM"
                        },
                        "Requestor": "192.168.10.91",
                        "Responsecode": "0",
                        "Soapversion": "2.6.3 - 09/23/13",
                        "Statusinfo": "|R,803,S,,",
                        "Version": "1.21",
                        "xmlns": "AT_WEB"
                    }
                },
                "encodingStyle": "http://schemas.xmlsoap.org/soap/encoding/",
                "soap": "http://schemas.xmlsoap.org/soap/envelope/",
                "soapenc": "http://schemas.xmlsoap.org/soap/encoding/",
                "xsd": "http://www.w3.org/2001/XMLSchema",
                "xsi": "http://www.w3.org/2001/XMLSchema-instance"
            }
        }
    }
};

module.exports = {
    arrivalsForStop: arrivalsForStop,
};
