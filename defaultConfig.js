exports.config = {
    "locale": "en",
    "delete": false,
    "change": false,
    "split": false,
    "servers": {
        "query": "https://127.0.0.1:8042",
        "store": "https://127.0.0.1:8042",
        "viewer": "https://127.0.0.1:8042"
    },
    "audit": "http://127.0.0.1:9201",
    "destinations": [
        {
            "label": "PORTAL",
            "name": "PORTAL"
        }
    ],
    "user": "user1"
};