var Dummy = require('../mocks/Dummy');
var Request = require('../mocks/dw/system/Request');
var Site = require('../mocks/dw/system/Site');
var web = require('../mocks/dw/web');
var system = require('../mocks/dw/system');
var util = require('../mocks/dw/util');
var Money = require('../mocks/dw/value/Money');
var ProductMgr = require('../mocks/dw/catalog/ProductMgr');
var Iterator = require('../mocks/dw/util/Iterator');
var Calendar = require('../mocks/dw/util/Calendar');
var BasketMgr = require('../mocks/dw/order/BasketMgr');
var PromotionMgr = require('../mocks/dw/campaign/PromotionMgr');
var PaymentMgr = require('../mocks/dw/order/PaymentMgr');
var Transaction = require('../mocks/dw/system/Transaction');
var HookMgr = require('../mocks/dw/system/HookMgr');
var Status = require('../mocks/dw/system/Status');
var LocalServiceRegistry = require('../mocks/dw/svc/LocalServiceRegistry');
var StringUtils = require('../mocks/dw/util/StringUtils');
var Order = require('../mocks/dw/order/Order');
var OrderMgr = require('../mocks/dw/order/OrderMgr');
var Resource = require('../mocks/dw/web/Resource');
var URLUtils = require('../mocks/dw/web/URLUtils');
var File = require('../mocks/dw/io/File');
var FileReader = require('../mocks/dw/io/FileReader');
var FileWriter = require('../mocks/dw/io/FileWriter');
var PaymentInstrument = require('../mocks/dw/order/PaymentInstrument');
var app = require('../mocks/cartridge/scripts/app');
var server = { forms: { getForm: function () { return { paymentMethod: 'Affirm' }; } } };
var Session = require('../mocks/dw/system/Session');
var array = require('../mocks/cartridge/scripts/util/array');
var collections = require('../mocks/cartridge/scripts/util/collections');
var Shipment = require('../mocks/dw/order/Shipment');
var HashMap = require('../mocks/dw/util/Map');
var ArrayList = require('../mocks/dw/util/ArrayList');
var ShippingMgr = require('../mocks/dw/order/ShippingMgr');
var PriceBookMgr = require('../mocks/dw/catalog/PriceBookMgr');
var HTTPClient = require('../mocks/dw/net/HTTPClient');


var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = function (obj) {
    if (obj === null || obj === undefined || obj === '' || (typeof (obj) !== 'function' && obj.length !== undefined && obj.length === 0)) {
        return true;
    }
    return false;
};
global.request = new Request();
global.res = {
    render: function () {}
};
global.session = new Session();
global.dw = {
    system: system
};

Array.prototype.iterator = function () { return new Iterator(this); };
Array.prototype.toArray = function () { return this; };
String.prototype.getValue = function () { return this; };

var affirmData = proxyquire('../../cartridges/int_affirm/cartridge/scripts/data/affirmData', {
    'dw/system': system,
    'dw/web': web,
    'dw/system/Site': Site
});

var affirmUtils = proxyquire('../../cartridges/int_affirm/cartridge/scripts/utils/affirmUtils', {
    'dw/web': web,
    'dw/system': system,
    'dw/util': util,
    '*/cartridge/scripts/data/affirmData': affirmData,
    'dw/util/Calendar': Calendar,
    'dw/order/BasketMgr': BasketMgr,
    'dw/value/Money': Money,
    'dw/campaign/PromotionMgr': PromotionMgr,
    'dw/campaign/Promotion': Dummy,
    'dw/catalog/ProductMgr': ProductMgr,
    'dw/web/URLUtils': URLUtils,
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/order/Shipment': Shipment,
    'dw/system/Transaction': Transaction,
    'dw/order/OrderMgr': OrderMgr,
    'dw/util/HashMap': HashMap,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/util/ArrayList': ArrayList,
    'dw/catalog/PriceBookMgr': PriceBookMgr
});

var affirmBasket = proxyquire('../../cartridges/int_affirm/cartridge/scripts/basket/affirmBasket', {
    'dw/web': web,
    'dw/system': system,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/order/BasketMgr': BasketMgr,
    'dw/catalog/ProductMgr': ProductMgr,
    'dw/system/HookMgr': HookMgr,
    'dw/system/Transaction': Transaction,
    '*/cartridge/scripts/data/affirmData': affirmData,
    '*/cartridge/scripts/utils/affirmUtils': affirmUtils,
    'dw/system/Status': Status
});

var jobUtils = require('../../cartridges/int_affirm/cartridge/scripts/utils/jobUtils');

var initAffirmServices = proxyquire('../../cartridges/int_affirm/cartridge/scripts/init/initAffirmServices', {
    'dw/util/StringUtils': StringUtils,
    'dw/system/Site': Site,
    'dw/svc/LocalServiceRegistry': LocalServiceRegistry,
    '*/cartridge/scripts/utils/jobUtils': jobUtils
});

var affirmTracker = proxyquire('../../cartridges/int_affirm/cartridge/scripts/utils/affirmTracker', {
    'dw/net/HTTPClient': HTTPClient,
    'dw/util/StringUtils': StringUtils,
    'dw/system/Site': Site,
    '*/cartridge/scripts/utils/affirmUtils': affirmUtils
});

var affirmAPI = proxyquire('../../cartridges/int_affirm/cartridge/scripts/api/affirmAPI', {
    'dw/system': system,
    '*/cartridge/scripts/data/affirmData': affirmData,
    '*/cartridge/scripts/init/initAffirmServices': initAffirmServices,
    '*/cartridge/scripts/utils/affirmTracker': affirmTracker
});

var affirmOrder = proxyquire('../../cartridges/int_affirm/cartridge/scripts/order/affirmOrder', {
    'dw/system': system,
    'dw/order/Order': Order,
    'dw/order/OrderMgr': OrderMgr,
    'dw/value/Money': Money,
    'dw/io/File': File,
    'dw/io/FileReader': FileReader,
    'dw/io/FileWriter': FileWriter,
    '*/cartridge/scripts/data/affirmData': affirmData,
    '*/cartridge/scripts/basket/affirmBasket': affirmBasket,
    '*/cartridge/scripts/api/affirmAPI': affirmAPI,
    '*/cartridge/scripts/utils/affirmTracker': affirmTracker
});

var affirm = proxyquire('../../cartridges/int_affirm/cartridge/scripts/affirm', {
    './basket/affirmBasket': affirmBasket,
    './data/affirmData': affirmData,
    './order/affirmOrder': affirmOrder,
    './utils/affirmUtils': affirmUtils
});

var affirmHelper = proxyquire('../../cartridges/int_affirm/cartridge/scripts/utils/affirmHelper', {
    'dw/web/Resource': Resource,
    'dw/web/URLUtils': URLUtils,
    server: server,
    'dw/order/BasketMgr': BasketMgr,
    'dw/template/ISML': Dummy,
    '*/cartridge/scripts/affirm': affirm,
    '*/cartridge/scripts/checkout/checkoutHelpers': Dummy,
    'dw/system/Status': Status,
    'dw/system/Transaction': Transaction,
    'dw/order/Order': Order,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/value/Money': Money,
    'dw/system': system
});

// Jobs
var capture = proxyquire('../../cartridges/int_affirm/cartridge/scripts/jobs/capture', {
    'dw/system/Status': Status,
    '*/cartridge/scripts/affirm': affirm
});

var fullprocess = proxyquire('../../cartridges/int_affirm/cartridge/scripts/jobs/fullProcess', {
    'dw/system/Status': Status,
    '*/cartridge/scripts/affirm': affirm
});

var refund = proxyquire('../../cartridges/int_affirm/cartridge/scripts/jobs/refund', {
    'dw/system/Status': Status,
    '*/cartridge/scripts/affirm': affirm
});

var update = proxyquire('../../cartridges/int_affirm/cartridge/scripts/jobs/update', {
    'dw/system/Status': Status,
    '*/cartridge/scripts/affirm': affirm
});

var voidJob = proxyquire('../../cartridges/int_affirm/cartridge/scripts/jobs/void', {
    'dw/system/Status': Status,
    '*/cartridge/scripts/affirm': affirm
});

var BASIC_CREDIT = proxyquire('../../cartridges/int_affirm_controllers/cartridge/scripts/payment/instrument/BASIC_CREDIT', {
    'dw/web/Resource': Resource,
    '*/cartridge/scripts/app': app,
    'dw/system/Transaction': Transaction,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/order/PaymentInstrument': PaymentInstrument
});

var AFFIRM_PAYMENT = proxyquire('../../cartridges/int_affirm_controllers/cartridge/scripts/payment/processor/AFFIRM_PAYMENT', {
    'dw/order/BasketMgr': BasketMgr,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/system/Transaction': Transaction,
    '*/cartridge/scripts/affirm': affirm,
    'dw/order/OrderMgr': OrderMgr
});

var BASIC_CREDIT_SFRA = proxyquire('../../cartridges/int_affirm_sfra/cartridge/scripts/payment/instrument/BASIC_CREDIT', {
    'dw/web/Resource': Resource,
    '*/cartridge/scripts/app': app,
    '*/cartridge/scripts/utils/affirmHelper': affirmHelper,
    'dw/system/Transaction': Transaction,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/order/PaymentInstrument': PaymentInstrument
});

var AFFIRM_PAYMENT_SFRA = proxyquire('../../cartridges/int_affirm_sfra/cartridge/scripts/payment/processor/AFFIRM_PAYMENT', {
    'dw/order/BasketMgr': BasketMgr,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/system/Transaction': Transaction,
    '*/cartridge/scripts/affirm': affirm,
    'dw/order/OrderMgr': OrderMgr
});

var affirmFormProcessor = proxyquire('../../cartridges/int_affirm_sfra/cartridge/scripts/payment/processor/affirm_form_processor', {
    'dw/system/Transaction': Dummy,
    'dw/order/BasketMgr': BasketMgr,
    '*/cartridge/scripts/checkout/checkoutHelpers': Dummy,
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/order/PaymentInstrument': PaymentInstrument,
    '*/cartridge/scripts/util/array': array
});

var payment = proxyquire('../../cartridges/int_affirm_sfra/cartridge/models/payment', {
    'dw/order/PaymentMgr': PaymentMgr,
    'dw/order/PaymentInstrument': PaymentInstrument,
    '*/cartridge/scripts/util/collections': collections,
    '*/cartridge/scripts/affirm': affirm
});

module.exports = {
    affirmData: affirmData,
    affirmUtils: affirmUtils,
    affirmBasket: affirmBasket,
    jobUtils: jobUtils,
    initAffirmServices: initAffirmServices,
    affirmTracker: affirmTracker,
    affirmAPI: affirmAPI,
    affirmOrder: affirmOrder,
    affirm: affirm,
    affirmHelper: affirmHelper,
    capture: capture,
    fullprocess: fullprocess,
    refund: refund,
    update: update,
    void: voidJob,
    BASIC_CREDIT: BASIC_CREDIT,
    AFFIRM_PAYMENT: AFFIRM_PAYMENT,
    BASIC_CREDIT_SFRA: BASIC_CREDIT_SFRA,
    AFFIRM_PAYMENT_SFRA: AFFIRM_PAYMENT_SFRA,
    affirm_form_processor: affirmFormProcessor,
    payment: payment
};
