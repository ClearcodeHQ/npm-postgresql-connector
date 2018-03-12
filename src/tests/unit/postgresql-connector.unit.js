'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();


beforeEach(function() {
  global.timeout = sinon.spy();

  global.FakePool = sinon.stub();
  FakePool.prototype.create = sinon.stub();

  global.PgConnector = proxyquire('./../../postgresql-connector.js', {
    'synchronous-timeout': timeout,
    pg: {Pool: FakePool},
  });
});

describe('Elasticsearch connector', async function() {
  describe('#Connector.connectToElasticsearch', function() {
    it('Should not wait if not specified', async function() {
      FakePool.prototype.connect = sinon.stub().returns(Promise.resolve());

      const Connector = new PgConnector();
      await Connector.connectToPostgresql();

      assert.isFalse(timeout.called);
    });

    it('Should wait for specified amount if specified', async function() {
      FakePool.prototype.connect = sinon.stub().returns(Promise.resolve());

      const Connector = new PgConnector();
      await Connector.connectToPostgresql(5000);

      assert.isTrue(timeout.called);
      assert.isTrue(timeout.calledWith(5000));
    });

    it('Should double the wait time for subsequent calls', async function() {
      FakePool.prototype.connect = sinon.stub();
      FakePool.prototype.connect.onCall(0).returns(Promise.reject({stack: ''}));
      FakePool.prototype.connect.onCall(1).returns(Promise.reject({stack: ''}));
      FakePool.prototype.connect.returns(Promise.resolve());

      const Connector = new PgConnector();
      await Connector.connectToPostgresql();

      let firstTimeout = timeout.withArgs(5000);
      let secondTimeout = timeout.withArgs(10000);

      assert.isTrue(firstTimeout.calledOnce);
      assert.isTrue(secondTimeout.calledOnce);
      assert.isTrue(secondTimeout.calledAfter(firstTimeout));
    });
    
    it('Should try to reconnect if connection failed', async function() {
      FakePool.prototype.connect = sinon.stub();
      FakePool.prototype.connect.onCall(0).returns(Promise.reject({stack: ''}));
      FakePool.prototype.connect.returns(Promise.resolve());

      const Connector = new PgConnector();
      const result = await Connector.connectToPostgresql();

      assert.equal(Connector.getConnectionRetryCount(), 1);
      assert.isObject(result);
    });

    it('Should return null if connection retry limit was reached', async function() {
      FakePool.prototype.connect = sinon.stub();
      FakePool.prototype.connect.onCall(0).returns(Promise.reject({stack: ''}));
      FakePool.prototype.connect.returns(Promise.resolve());

      const Connector = new PgConnector({maxPostgresqlConnectionRetries: 0});
      const result = await Connector.connectToPostgresql();

      assert.equal(Connector.getConnectionRetryCount(), 0);
      assert.isNull(result);
    });
  });
});
