var assert = require('chai').assert;
var Site = require('../../../../mocks/dw/system/Site');

var affirmData = require('../../../filesProxyquire').affirmData;

describe('int_affirm/cartridge/scripts/data/affirmData', function () {
    beforeEach(function () {
        Site.restoreDefaultCustom();
    });

    it('isObject', function () {
        assert.isObject(affirmData);
    });

    it('getCustomPreferenceValue should return AffirmPublicKey site preference', function () {
        assert.isString(affirmData.getPublicKey());
        assert.equal(affirmData.getPublicKey(), 'TestAffirmPublicKey');
    });

    it('getPrivateKey should return AffirmPrivateKey site preference', function () {
        assert.isString(affirmData.getPrivateKey());
        assert.equal(affirmData.getPrivateKey(), 'TestAffirmPrivateKey');
    });

    it('getAffirmOnlineStatus should return AffirmOnline site preference', function () {
        assert.isBoolean(affirmData.getAffirmOnlineStatus());
        assert.isTrue(affirmData.getAffirmOnlineStatus());
        Site.changeCustomPrefForTesting('AffirmOnline', false);
        assert.isFalse(affirmData.getAffirmOnlineStatus());
        Site.changeCustomPrefForTesting('AffirmOnline', null);
        assert.isFalse(affirmData.getAffirmOnlineStatus());
    });

    it('getAnalyticsStatus should return AffirmAnalytics site preference', function () {
        assert.isBoolean(affirmData.getAnalyticsStatus());
        assert.isFalse(affirmData.getAnalyticsStatus());
        Site.changeCustomPrefForTesting('AffirmAnalytics', true);
        assert.isTrue(affirmData.getAnalyticsStatus(), 'Change to true didn\'t work');
    });

    it('getAffirmPaymentAction should return AffirmPaymentAction site preference or empty string', function () {
        assert.isString(affirmData.getAffirmPaymentAction());
        assert.equal(affirmData.getAffirmPaymentAction(), 'AUTH');
        Site.changeCustomPrefForTesting('AffirmPaymentAction', null);
        assert.isString(affirmData.getAffirmPaymentAction());
        assert.equal(affirmData.getAffirmPaymentAction(), '');
    });

    it('getURLPath should return URL String', function () {
        assert.isString(affirmData.getURLPath());
        assert.equal(affirmData.getURLPath(), 'affirm.' + new Site().getCustomPreferenceValue('AffirmMode') + '.url');
    });

    it('getJSPath should return js path String', function () {
        assert.isString(affirmData.getJSPath());
        assert.equal(affirmData.getJSPath(), 'affirm.' + new Site().getCustomPreferenceValue('AffirmMode') + '.js');
    });

    it('getCartPromoMessageStatus should return AffirmCartPromoMessage site preference', function () {
        assert.isBoolean(affirmData.getCartPromoMessageStatus());
        assert.isTrue(affirmData.getCartPromoMessageStatus());
        Site.changeCustomPrefForTesting('AffirmCartPromoMessage', false);
        assert.isFalse(affirmData.getCartPromoMessageStatus());
        Site.changeCustomPrefForTesting('AffirmCartPromoMessage', null);
        assert.isFalse(affirmData.getCartPromoMessageStatus());
    });

    it('getPLPPromoMessageStatus should return AffirmPLPPromoMessage site preference', function () {
        assert.isBoolean(affirmData.getPLPPromoMessageStatus());
        assert.isTrue(affirmData.getPLPPromoMessageStatus());
        Site.changeCustomPrefForTesting('AffirmPLPPromoMessage', false);
        assert.isFalse(affirmData.getPLPPromoMessageStatus());
        Site.changeCustomPrefForTesting('AffirmPLPPromoMessage', null);
        assert.isFalse(affirmData.getPLPPromoMessageStatus());
    });

    it('getProductPromoMessageStatus should return AffirmProductMessage site preference', function () {
        assert.isBoolean(affirmData.getProductPromoMessageStatus());
        assert.isTrue(affirmData.getProductPromoMessageStatus());
        Site.changeCustomPrefForTesting('AffirmProductMessage', false);
        assert.isFalse(affirmData.getProductPromoMessageStatus());
        Site.changeCustomPrefForTesting('AffirmProductMessage', null);
        assert.isFalse(affirmData.getProductPromoMessageStatus());
    });

    it('getCartTotalMapping should return AffirmFPTotalRange site preference', function () {
        assert.isArray(affirmData.getCartTotalMapping());
        assert.sameOrderedMembers(affirmData.getCartTotalMapping(), ['100|200|GoldPriceFinProgram']);
    });

    it('getDefaultFinancingProgram should return AffirmDefaultFP site preference or empty string', function () {
        assert.isString(affirmData.getDefaultFinancingProgram());
        assert.equal(affirmData.getDefaultFinancingProgram(), '50.0');
    });

    it('getCustomerGroupMapping should return AffirmFPCustomerGroup site preference', function () {
        assert.isArray(affirmData.getCustomerGroupMapping());
        assert.sameOrderedMembers(affirmData.getCustomerGroupMapping(), ['Registered|PremiumFinProgram']);
    });

    it('getAffirmPaymentOnlineStatus should return AffirmPaymentOnlineStatus site preference', function () {
        assert.isBoolean(affirmData.getAffirmPaymentOnlineStatus());
        assert.isFalse(affirmData.getAffirmPaymentOnlineStatus());
        Site.changeCustomPrefForTesting('AffirmPaymentOnlineStatus', true);
        assert.isTrue(affirmData.getAffirmPaymentOnlineStatus());
    });

    it('getDateRangeMapping should return AffirmFPDateRange site preference', function () {
        assert.isArray(affirmData.getDateRangeMapping());
        assert.sameOrderedMembers(affirmData.getDateRangeMapping(), ['2019-01-01|2021-01-01|ThisYearFinProgram']);
    });

    it('getAffirmVCNStatus should return AffirmVCNIntegration site preference or empty string', function () {
        assert.isString(affirmData.getAffirmVCNStatus());
        assert.equal(affirmData.getAffirmVCNStatus(), 'off');
    });

    it('getAffirmMinTotal should return AffirmMinTotal site preference or empty string', function () {
        assert.isNumber(affirmData.getAffirmMinTotal());
        assert.equal(affirmData.getAffirmMinTotal(), 50);
    });

    it('getAffirmPaymentMinTotal should return AffirmPaymentMinTotal site preference or empty string', function () {
        assert.isNumber(affirmData.getAffirmPaymentMinTotal());
        assert.equal(affirmData.getAffirmPaymentMinTotal(), 50);
    });

    it('getAffirmPaymentMaxTotal should return AffirmPaymentMaxTotal site preference or empty string', function () {
        assert.isNumber(affirmData.getAffirmPaymentMaxTotal());
        assert.equal(affirmData.getAffirmPaymentMaxTotal(), 200);
    });

    it('getErrorMessages should return JSON with error strings', function () {
        var json = JSON.parse(affirmData.getErrorMessages());
        assert.isObject(json);
        assert.propertyVal(json, 'closed', 'affirm.error.closed');
        assert.propertyVal(json, 'default', 'affirm.error.default');
    });

    it('VCNPaymentInstrument should return AffirmVCNPaymentInstrument site preference or empty string', function () {
        assert.isString(affirmData.VCNPaymentInstrument());
        assert.equal(affirmData.VCNPaymentInstrument(), 'BASIC_CREDIT');
    });
});
