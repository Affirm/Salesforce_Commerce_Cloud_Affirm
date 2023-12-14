var assert = require('chai').assert;
var affirmTracker = require('../../../filesProxyquire').affirmTracker;

describe('int_affirm/cartridge/scripts/utils/affirmTracker', function () {
    context('method trackErrorWithoutStack', function () {
        it('should return void', function () {
            var actual = affirmTracker.trackErrorWithoutStack('auth', 'test message', 'INTERNAL_SERVER_ERROR');
            assert.isUndefined(actual);
        });
    });

    context('method trackErrorWithStack', function () {
        it('should return void', function () {
            var actual = affirmTracker.trackErrorWithStack(
                'auth',
                {
                    'message': 'test message',
                    'name': 'TestError',
                    'stack': 'at foo/bar.js:71'
                });
            assert.isUndefined(actual);
        });
    });
});
