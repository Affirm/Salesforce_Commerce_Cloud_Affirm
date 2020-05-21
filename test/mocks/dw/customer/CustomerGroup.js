/**
 * Represents dw.customer.CustomerGroup
 */

var CustomerGroup = function(ID){
    this.ID = ID;
};

CustomerGroup.prototype.description = null; //String
CustomerGroup.prototype.ID = null; //String
CustomerGroup.prototype.rullBased = null; // boolean


CustomerGroup.prototype.assignCustomer = function(customer){}; //void
CustomerGroup.prototype.getDescription = function(){}; // String
CustomerGroup.prototype.getID = function(){}; // String
CustomerGroup.prototype.isRuleBased = function(){}; // boolean
CustomerGroup.prototype.unassignCustomer = function(customer){}; //void

module.exports = CustomerGroup;