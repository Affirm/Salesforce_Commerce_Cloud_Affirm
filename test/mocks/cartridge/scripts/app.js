var Money = require('../../dw/value/Money');

var models = {
    Cart: {
        removeExistingPaymentInstruments: function (method) {
            var iter = this.getPaymentInstruments(method).iterator();

            // Remove payment instruments.
            while (iter.hasNext()) {
                this.removePaymentInstrument(iter.next());
            }
        },
        getNonGiftCertificateAmount: function () {
            // The total redemption amount of all gift certificate payment instruments in the basket.
            var giftCertTotal = new Money(0.0, this.getCurrencyCode());

            // Gets the list of all gift certificate payment instruments
            var gcPaymentInstrs = this.getGiftCertificatePaymentInstruments();
            var iter = gcPaymentInstrs.iterator();
            var orderPI = null;

            // Sums the total redemption amount.
            while (iter.hasNext()) {
                orderPI = iter.next();
                giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
            }

            // Gets the order total.
            var orderTotal = this.getTotalGrossPrice();

            // Calculates the amount to charge for the payment instrument.
            // This is the remaining open order total that must be paid.
            var amountOpen = orderTotal.subtract(giftCertTotal);

            // Returns the open amount to be paid.
            return amountOpen;
        },
        get: function (basket) {
            Object.assign(basket, this);
            return basket;
        }
    }
};
module.exports = {
    getModel: function (name) { return models[name]; }
}
;

