var AffirmResponse = function (totalPrice) {
    this.details = {
        total: totalPrice * 100
    };
    this.events = [{ id: 'TestAffirmToken' }];
    this.amount = totalPrice * 100;
    this.id = 'TestAfffirmExternalID';
};
module.exports = AffirmResponse;
