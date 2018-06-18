(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
    	factory()();
  }
}(this, function () {
    return function () {
    	$(document).on('initAffirm', function(){
    		
    		var $this = $(this),
    			$promo = $this.find('.js-affirm-promo'),
    			$text = $promo.find('.js-affirm-text');
    			
    		if($promo.length){
	    		affirm.ui.ready(function() {
	        		affirm.ui.payments.get_estimate({
	    	    		'months' :  parseInt($promo.data('affirm-month')),
	    	    		'apr' : $promo.data('affirm-apr'),
	    	    		'amount' : parseInt($promo.data('affirm-amount'))
	    	    	}, function (estimates) {
	    	    		var text = $promo.data('affirm-text'),
	    	    			dollars = 0|(estimates.payment / 100),
	        	    	 	cents = (estimates.payment % 100),
	        	    	    cents = cents < 10 ? "0"+cents : cents+"";   	    		
	    	    		$text.text(text.replace("{dollars}", dollars).replace("{cents}", cents));
	    	        });
	        	});
	        }	
    	}).trigger('initAffirm');
    	    	
    	$(document).ajaxComplete(function(event, request, settings) {
    		if (settings.url.indexOf('Product-Variation') !== -1) {
    			$(document).trigger('initAffirm');
    		} 
    	});

    	$(document).on('click', '.js-affirm-text', function(e) {
        	event.preventDefault();
        	new affirm.widgets.learn_more();
    	});
    };
}));