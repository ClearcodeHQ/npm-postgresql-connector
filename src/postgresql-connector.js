'use strict';

const timeout = require('@clearcodehq/synchronous-timeout');

const {Pool} = require('pg');

function Connector(userConfig) {
  let postgresqlConnectionRetries = 0;

  let config = {
    host: process.env.PGSQL_DB_HOST,
    port: process.env.PGSQL_DB_PORT,
    database: process.env.PGSQL_DB_NAME,
    user: process.env.PGSQL_DB_USER,
    password: process.env.PGSQL_DB_PASSWORD,
    maxPostgresqlConnectionRetries: 10,
    retryAfter: 5000,
  };

  if (userConfig) {
    Object.assign(config, userConfig);
  }

  const postgresql = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: config.maxPostgresqlConnectionRetries,
    min: 1,
  });

  async function connectToPostgresql(retryAfter) {
    console.log('Connecting to PostgreSQL');

    if (retryAfter) {
      await timeout(retryAfter);
      config.retryAfter *= 2;
    }

    return postgresql.connect()
      .then(function() {
        return postgresql;
      })
      .catch(function(exception) {
        console.warn('PostgreSQL connection error', exception.stack);
        if (postgresqlConnectionRetries === config.maxPostgresqlConnectionRetries) {
          console.error(
            `Maximum connection retries of ${config.maxPostgresqlConnectionRetries} to PostgreSQL reached, dying.`
          );
          return null;
        } else {
          console.warn(`Retrying connection to PostgreSQL after delay of ${config.retryAfter} ms`);
          postgresqlConnectionRetries++;
          return connectToPostgresql(config.retryAfter);
        }
      });
  }

  function getConnectionRetryCount() {
    return postgresqlConnectionRetries;
  }

  this.connectToPostgresql = connectToPostgresql;
  this.getConnectionRetryCount = getConnectionRetryCount;
}

module.exports = Connector;
