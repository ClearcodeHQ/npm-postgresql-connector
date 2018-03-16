# PostgreSQL connector

Simplifies asynchronous connection to PostgreSQL with connection retrying.

If connection cannot be established, a new attempt will be made after a delay set in config (5 seconds by default). Every subsequent retry will occur after two times as long (so by default 10, 20, 40, 80 etc seconds). You can set how many times connection will be retried (10 by default).

## Installation

Add to your dependencies:

```
"dependencies": {
    "postgresql-connector": "https://github.com/ClearcodeHQ/npm-postgresql-connector"
}
```

# Usage

```
const PgConnector = require("postgresql-connector");

// You can, but don't have to pass the config array or any of its values
const config = {
    host: 'postgres', // by default process.env.PGSQL_DB_HOST,
    port: 5432, // by default process.env.PGSQL_DB_PORT,
    database: 'mydb', // by default process.env.PGSQL_DB_NAME,
    user: 'myuser', // by default process.env.PGSQL_DB_USER,
    password: 'mypassword', // by default process.env.PGSQL_DB_PASSWORD,
    maxPostgresqlConnectionRetries: 5, // by default 10,
    retryAfter: 3000, // in miliseconds, by default 5000
}

const Connector = new PgConnector(config);

// The returned value can be an instance node-postgres (pg) Pool object
// if the connection was successful, or null if it couldn't be obtained
// under constraints specified in config
const pool = await Connector.connectToPostgresql();
```
