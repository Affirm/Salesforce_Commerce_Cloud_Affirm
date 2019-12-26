/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./cartridges/int_affirm_sfra/cartridge/client/default/js/cart.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/components/focus.js":
/*!***************************************************************************************************************************!*\
  !*** ../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/components/focus.js ***!
  \***************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  setTabNextFocus: function (focusParams) {
    var KEYCODE_TAB = 9;
    var isTabPressed = focusParams.event.key === 'Tab' || focusParams.event.keyCode === KEYCODE_TAB;

    if (!isTabPressed) {
      return;
    }

    var firstFocusableEl = $(focusParams.containerSelector + ' ' + focusParams.firstElementSelector);
    var lastFocusableEl = $(focusParams.containerSelector + ' ' + focusParams.lastElementSelector);

    if ($(focusParams.containerSelector + ' ' + focusParams.lastElementSelector).is(':disabled')) {
      lastFocusableEl = $(focusParams.containerSelector + ' ' + focusParams.nextToLastElementSelector);

      if ($('.product-quickview.product-set').length > 0) {
        var linkElements = $(focusParams.containerSelector + ' a#fa-link.share-icons');
        lastFocusableEl = linkElements[linkElements.length - 1];
      }
    }

    if (focusParams.event.shiftKey)
      /* shift + tab */
      {
        if ($(':focus').is(firstFocusableEl)) {
          lastFocusableEl.focus();
          focusParams.event.preventDefault();
        }
      } else
      /* tab */
      {
        if ($(':focus').is(lastFocusableEl)) {
          // eslint-disable-line
          firstFocusableEl.focus();
          focusParams.event.preventDefault();
        }
      }
  }
};

/***/ }),

/***/ "../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/product/base.js":
/*!***********************************************************************************************************************!*\
  !*** ../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/product/base.js ***!
  \***********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var focusHelper = __webpack_require__(/*! ../components/focus */ "../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/components/focus.js");
/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */


function getPidValue($el) {
  var pid;

  if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
    pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
  } else if ($('.product-set-detail').length || $('.product-set').length) {
    pid = $($el).closest('.product-detail').find('.product-id').text();
  } else {
    pid = $('.product-detail:not(".bundle-item")').data('pid');
  }

  return pid;
}
/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */


function getQuantitySelector($el) {
  return $el && $('.set-items').length ? $($el).closest('.product-detail').find('.quantity-select') : $('.quantity-select');
}
/**
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */


function getQuantitySelected($el) {
  return getQuantitySelector($el).val();
}
/**
 * Process the attribute values for an attribute that has image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 * @param {Object} msgs - object containing resource messages
 */


function processSwatchValues(attr, $productContainer, msgs) {
  attr.values.forEach(function (attrValue) {
    var $attrValue = $productContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="' + attrValue.value + '"]');
    var $swatchButton = $attrValue.parent();

    if (attrValue.selected) {
      $attrValue.addClass('selected');
      $attrValue.siblings('.selected-assistive-text').text(msgs.assistiveSelectedText);
    } else {
      $attrValue.removeClass('selected');
      $attrValue.siblings('.selected-assistive-text').empty();
    }

    if (attrValue.url) {
      $swatchButton.attr('data-url', attrValue.url);
    } else {
      $swatchButton.removeAttr('data-url');
    } // Disable if not selectable


    $attrValue.removeClass('selectable unselectable');
    $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
  });
}
/**
 * Process attribute values associated with an attribute that does not have image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */


function processNonSwatchValues(attr, $productContainer) {
  var $attr = '[data-attr="' + attr.id + '"]';
  var $defaultOption = $productContainer.find($attr + ' .select-' + attr.id + ' option:first');
  $defaultOption.attr('value', attr.resetUrl);
  attr.values.forEach(function (attrValue) {
    var $attrValue = $productContainer.find($attr + ' [data-attr-value="' + attrValue.value + '"]');
    $attrValue.attr('value', attrValue.url).removeAttr('disabled');

    if (!attrValue.selectable) {
      $attrValue.attr('disabled', true);
    }
  });
}
/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 *
 * @param {Object} attrs - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {jQuery} $productContainer - DOM element for a given product
 * @param {Object} msgs - object containing resource messages
 */


function updateAttrs(attrs, $productContainer, msgs) {
  // Currently, the only attribute type that has image swatches is Color.
  var attrsWithSwatches = ['color'];
  attrs.forEach(function (attr) {
    if (attrsWithSwatches.indexOf(attr.id) > -1) {
      processSwatchValues(attr, $productContainer, msgs);
    } else {
      processNonSwatchValues(attr, $productContainer);
    }
  });
}
/**
 * Updates the availability status in the Product Detail Page
 *
 * @param {Object} response - Ajax response object after an
 *                            attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */


function updateAvailability(response, $productContainer) {
  var availabilityValue = '';
  var availabilityMessages = response.product.availability.messages;

  if (!response.product.readyToOrder) {
    availabilityValue = '<li><div>' + response.resources.info_selectforstock + '</div></li>';
  } else {
    availabilityMessages.forEach(function (message) {
      availabilityValue += '<li><div>' + message + '</div></li>';
    });
  }

  $($productContainer).trigger('product:updateAvailability', {
    product: response.product,
    $productContainer: $productContainer,
    message: availabilityValue,
    resources: response.resources
  });
}
/**
 * Generates html for product attributes section
 *
 * @param {array} attributes - list of attributes
 * @return {string} - Compiled HTML
 */


function getAttributesHtml(attributes) {
  if (!attributes) {
    return '';
  }

  var html = '';
  attributes.forEach(function (attributeGroup) {
    if (attributeGroup.ID === 'mainAttributes') {
      attributeGroup.attributes.forEach(function (attribute) {
        html += '<div class="attribute-values">' + attribute.label + ': ' + attribute.value + '</div>';
      });
    }
  });
  return html;
}
/**
 * @typedef UpdatedOptionValue
 * @type Object
 * @property {string} id - Option value ID for look up
 * @property {string} url - Updated option value selection URL
 */

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * Updates DOM using post-option selection Ajax response
 *
 * @param {OptionSelectionResponse} optionsHtml - Ajax response optionsHtml from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */


function updateOptions(optionsHtml, $productContainer) {
  // Update options
  $productContainer.find('.product-options').empty().html(optionsHtml);
}
/**
 * Dynamically creates Bootstrap carousel from response containing images
 * @param {Object[]} imgs - Array of large product images,along with related information
 * @param {jQuery} $productContainer - DOM element for a given product
 */


function createCarousel(imgs, $productContainer) {
  var carousel = $productContainer.find('.carousel');
  $(carousel).carousel('dispose');
  var carouselId = $(carousel).attr('id');
  $(carousel).empty().append('<ol class="carousel-indicators"></ol><div class="carousel-inner" role="listbox"></div><a class="carousel-control-prev" href="#' + carouselId + '" role="button" data-slide="prev"><span class="fa icon-prev" aria-hidden="true"></span><span class="sr-only">' + $(carousel).data('prev') + '</span></a><a class="carousel-control-next" href="#' + carouselId + '" role="button" data-slide="next"><span class="fa icon-next" aria-hidden="true"></span><span class="sr-only">' + $(carousel).data('next') + '</span></a>');

  for (var i = 0; i < imgs.length; i++) {
    $('<div class="carousel-item"><img src="' + imgs[i].url + '" class="d-block img-fluid" alt="' + imgs[i].alt + ' image number ' + parseInt(imgs[i].index, 10) + '" title="' + imgs[i].title + '" itemprop="image" /></div>').appendTo($(carousel).find('.carousel-inner'));
    $('<li data-target="#' + carouselId + '" data-slide-to="' + i + '" class=""></li>').appendTo($(carousel).find('.carousel-indicators'));
  }

  $($(carousel).find('.carousel-item')).first().addClass('active');
  $($(carousel).find('.carousel-indicators > li')).first().addClass('active');

  if (imgs.length === 1) {
    $($(carousel).find('.carousel-indicators, a[class^="carousel-control-"]')).detach();
  }

  $(carousel).carousel();
  $($(carousel).find('.carousel-indicators')).attr('aria-hidden', true);
}
/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {Object} response - response from Ajax call
 * @param {Object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {Object[]} response.product.variationAttributes - Product attributes
 * @param {Object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */


function handleVariantResponse(response, $productContainer) {
  var isChoiceOfBonusProducts = $productContainer.parents('.choose-bonus-product-dialog').length > 0;
  var isVaraint;

  if (response.product.variationAttributes) {
    updateAttrs(response.product.variationAttributes, $productContainer, response.resources);
    isVaraint = response.product.productType === 'variant';

    if (isChoiceOfBonusProducts && isVaraint) {
      $productContainer.parent('.bonus-product-item').data('pid', response.product.id);
      $productContainer.parent('.bonus-product-item').data('ready-to-order', response.product.readyToOrder);
    }
  } // Update primary images


  var primaryImageUrls = response.product.images.large;
  createCarousel(primaryImageUrls, $productContainer); // Update pricing

  if (!isChoiceOfBonusProducts) {
    var $priceSelector = $('.prices .price', $productContainer).length ? $('.prices .price', $productContainer) : $('.prices .price');
    $priceSelector.replaceWith(response.product.price.html);
  } // Update promotions


  $productContainer.find('.promotions').empty().html(response.product.promotionsHtml);
  updateAvailability(response, $productContainer);

  if (isChoiceOfBonusProducts) {
    var $selectButton = $productContainer.find('.select-bonus-product');
    $selectButton.trigger('bonusproduct:updateSelectButton', {
      product: response.product,
      $productContainer: $productContainer
    });
  } else {
    // Enable "Add to Cart" button if all required attributes have been selected
    $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
      product: response.product,
      $productContainer: $productContainer
    }).trigger('product:statusUpdate', response.product);
  } // Update attributes


  $productContainer.find('.main-attributes').empty().html(getAttributesHtml(response.product.attributes));
}
/**
 * @typespec UpdatedQuantity
 * @type Object
 * @property {boolean} selected - Whether the quantity has been selected
 * @property {string} value - The number of products to purchase
 * @property {string} url - Compiled URL that specifies variation attributes, product ID, options,
 *     etc.
 */

/**
 * Updates the quantity DOM elements post Ajax call
 * @param {UpdatedQuantity[]} quantities -
 * @param {jQuery} $productContainer - DOM container for a given product
 */


function updateQuantities(quantities, $productContainer) {
  if (!($productContainer.parent('.bonus-product-item').length > 0)) {
    var optionsHtml = quantities.map(function (quantity) {
      var selected = quantity.selected ? ' selected ' : '';
      return '<option value="' + quantity.value + '"  data-url="' + quantity.url + '"' + selected + '>' + quantity.value + '</option>';
    }).join('');
    getQuantitySelector($productContainer).empty().html(optionsHtml);
  }
}
/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */


function attributeSelect(selectedValueUrl, $productContainer) {
  if (selectedValueUrl) {
    $('body').trigger('product:beforeAttributeSelect', {
      url: selectedValueUrl,
      container: $productContainer
    });
    $.ajax({
      url: selectedValueUrl,
      method: 'GET',
      success: function (data) {
        handleVariantResponse(data, $productContainer);
        updateOptions(data.product.optionsHtml, $productContainer);
        updateQuantities(data.product.quantities, $productContainer);
        $('body').trigger('product:afterAttributeSelect', {
          data: data,
          container: $productContainer
        });
        $.spinner().stop();
      },
      error: function () {
        $.spinner().stop();
      }
    });
  }
}
/**
 * Retrieves url to use when adding a product to the cart
 *
 * @return {string} - The provided URL to use when adding a product to the cart
 */


function getAddToCartUrl() {
  return $('.add-to-cart-url').val();
}
/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */


function parseHtml(html) {
  var $html = $('<div>').append($.parseHTML(html));
  var body = $html.find('.choice-of-bonus-product');
  var footer = $html.find('.modal-footer').children();
  return {
    body: body,
    footer: footer
  };
}
/**
 * Retrieves url to use when adding a product to the cart
 *
 * @param {Object} data - data object used to fill in dynamic portions of the html
 */


function chooseBonusProducts(data) {
  $('.modal-body').spinner().start();

  if ($('#chooseBonusProductModal').length !== 0) {
    $('#chooseBonusProductModal').remove();
  }

  var bonusUrl;

  if (data.bonusChoiceRuleBased) {
    bonusUrl = data.showProductsUrlRuleBased;
  } else {
    bonusUrl = data.showProductsUrlListBased;
  }

  var htmlString = '<!-- Modal -->' + '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">' + '<span class="enter-message sr-only" ></span>' + '<div class="modal-dialog choose-bonus-product-dialog" ' + 'data-total-qty="' + data.maxBonusItems + '"' + 'data-UUID="' + data.uuid + '"' + 'data-pliUUID="' + data.pliUUID + '"' + 'data-addToCartUrl="' + data.addToCartUrl + '"' + 'data-pageStart="0"' + 'data-pageSize="' + data.pageSize + '"' + 'data-moreURL="' + data.showProductsUrlRuleBased + '"' + 'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">' + '<!-- Modal content-->' + '<div class="modal-content">' + '<div class="modal-header">' + '    <span class="">' + data.labels.selectprods + '</span>' + '    <button type="button" class="close pull-right" data-dismiss="modal">' + '        <span aria-hidden="true">&times;</span>' + '        <span class="sr-only"> </span>' + '    </button>' + '</div>' + '<div class="modal-body"></div>' + '<div class="modal-footer"></div>' + '</div>' + '</div>' + '</div>';
  $('body').append(htmlString);
  $('.modal-body').spinner().start();
  $.ajax({
    url: bonusUrl,
    method: 'GET',
    dataType: 'json',
    success: function (response) {
      var parsedHtml = parseHtml(response.renderedTemplate);
      $('#chooseBonusProductModal .modal-body').empty();
      $('#chooseBonusProductModal .enter-message').text(response.enterDialogMessage);
      $('#chooseBonusProductModal .modal-header .close .sr-only').text(response.closeButtonText);
      $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
      $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
      $('#chooseBonusProductModal').modal('show');
      $.spinner().stop();
    },
    error: function () {
      $.spinner().stop();
    }
  });
}
/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */


function handlePostCartAdd(response) {
  $('.minicart').trigger('count:update', response);
  var messageType = response.error ? 'alert-danger' : 'alert-success'; // show add to cart toast

  if (response.newBonusDiscountLineItem && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
    chooseBonusProducts(response.newBonusDiscountLineItem);
  } else {
    if ($('.add-to-cart-messages').length === 0) {
      $('body').append('<div class="add-to-cart-messages"></div>');
    }

    $('.add-to-cart-messages').append('<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">' + response.message + '</div>');
    setTimeout(function () {
      $('.add-to-basket-alert').remove();
    }, 5000);
  }
}
/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */


function getChildProducts() {
  var childProducts = [];
  $('.bundle-item').each(function () {
    childProducts.push({
      pid: $(this).find('.product-id').text(),
      quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
    });
  });
  return childProducts.length ? JSON.stringify(childProducts) : [];
}
/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */


function getOptions($productContainer) {
  var options = $productContainer.find('.product-option').map(function () {
    var $elOption = $(this).find('.options-select');
    var urlValue = $elOption.val();
    var selectedValueId = $elOption.find('option[value="' + urlValue + '"]').data('value-id');
    return {
      optionId: $(this).data('option-id'),
      selectedValueId: selectedValueId
    };
  }).toArray();
  return JSON.stringify(options);
}
/**
 * Makes a call to the server to report the event of adding an item to the cart
 *
 * @param {string | boolean} url - a string representing the end point to hit so that the event can be recorded, or false
 */


function miniCartReportingUrl(url) {
  if (url) {
    $.ajax({
      url: url,
      method: 'GET',
      success: function () {// reporting urls hit on the server
      },
      error: function () {// no reporting urls hit on the server
      }
    });
  }
}

module.exports = {
  attributeSelect: attributeSelect,
  methods: {
    editBonusProducts: function (data) {
      chooseBonusProducts(data);
    }
  },
  focusChooseBonusProductModal: function () {
    $('body').on('shown.bs.modal', '#chooseBonusProductModal', function () {
      $('#chooseBonusProductModal').siblings().attr('aria-hidden', 'true');
      $('#chooseBonusProductModal .close').focus();
    });
  },
  onClosingChooseBonusProductModal: function () {
    $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
      $('#chooseBonusProductModal').siblings().attr('aria-hidden', 'false');
    });
  },
  trapChooseBonusProductModalFocus: function () {
    $('body').on('keydown', '#chooseBonusProductModal', function (e) {
      var focusParams = {
        event: e,
        containerSelector: '#chooseBonusProductModal',
        firstElementSelector: '.close',
        lastElementSelector: '.add-bonus-products'
      };
      focusHelper.setTabNextFocus(focusParams);
    });
  },
  colorAttribute: function () {
    $(document).on('click', '[data-attr="color"] button', function (e) {
      e.preventDefault();

      if ($(this).attr('disabled')) {
        return;
      }

      var $productContainer = $(this).closest('.set-item');

      if (!$productContainer.length) {
        $productContainer = $(this).closest('.product-detail');
      }

      attributeSelect($(this).attr('data-url'), $productContainer);
    });
  },
  selectAttribute: function () {
    $(document).on('change', 'select[class*="select-"], .options-select', function (e) {
      e.preventDefault();
      var $productContainer = $(this).closest('.set-item');

      if (!$productContainer.length) {
        $productContainer = $(this).closest('.product-detail');
      }

      attributeSelect(e.currentTarget.value, $productContainer);
    });
  },
  availability: function () {
    $(document).on('change', '.quantity-select', function (e) {
      e.preventDefault();
      var $productContainer = $(this).closest('.product-detail');

      if (!$productContainer.length) {
        $productContainer = $(this).closest('.modal-content').find('.product-quickview');
      }

      if ($('.bundle-items', $productContainer).length === 0) {
        attributeSelect($(e.currentTarget).find('option:selected').data('url'), $productContainer);
      }
    });
  },
  addToCart: function () {
    $(document).on('click', 'button.add-to-cart, button.add-to-cart-global', function () {
      var addToCartUrl;
      var pid;
      var pidsObj;
      var setPids;
      $('body').trigger('product:beforeAddToCart', this);

      if ($('.set-items').length && $(this).hasClass('add-to-cart-global')) {
        setPids = [];
        $('.product-detail').each(function () {
          if (!$(this).hasClass('product-set-detail')) {
            setPids.push({
              pid: $(this).find('.product-id').text(),
              qty: $(this).find('.quantity-select').val(),
              options: getOptions($(this))
            });
          }
        });
        pidsObj = JSON.stringify(setPids);
      }

      pid = getPidValue($(this));
      var $productContainer = $(this).closest('.product-detail');

      if (!$productContainer.length) {
        $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
      }

      addToCartUrl = getAddToCartUrl();
      var form = {
        pid: pid,
        pidsObj: pidsObj,
        childProducts: getChildProducts(),
        quantity: getQuantitySelected($(this))
      };

      if (!$('.bundle-item').length) {
        form.options = getOptions($productContainer);
      }

      $(this).trigger('updateAddToCartFormData', form);

      if (addToCartUrl) {
        $.ajax({
          url: addToCartUrl,
          method: 'POST',
          data: form,
          success: function (data) {
            handlePostCartAdd(data);
            $('body').trigger('product:afterAddToCart', data);
            $.spinner().stop();
            miniCartReportingUrl(data.reportingURL);
          },
          error: function () {
            $.spinner().stop();
          }
        });
      }
    });
  },
  selectBonusProduct: function () {
    $(document).on('click', '.select-bonus-product', function () {
      var $choiceOfBonusProduct = $(this).parents('.choice-of-bonus-product');
      var pid = $(this).data('pid');
      var maxPids = $('.choose-bonus-product-dialog').data('total-qty');
      var submittedQty = parseInt($choiceOfBonusProduct.find('.bonus-quantity-select').val(), 10);
      var totalQty = 0;
      $.each($('#chooseBonusProductModal .selected-bonus-products .selected-pid'), function () {
        totalQty += $(this).data('qty');
      });
      totalQty += submittedQty;
      var optionID = $choiceOfBonusProduct.find('.product-option').data('option-id');
      var valueId = $choiceOfBonusProduct.find('.options-select option:selected').data('valueId');

      if (totalQty <= maxPids) {
        var selectedBonusProductHtml = '' + '<div class="selected-pid row" ' + 'data-pid="' + pid + '"' + 'data-qty="' + submittedQty + '"' + 'data-optionID="' + (optionID || '') + '"' + 'data-option-selected-value="' + (valueId || '') + '"' + '>' + '<div class="col-sm-11 col-9 bonus-product-name" >' + $choiceOfBonusProduct.find('.product-name').html() + '</div>' + '<div class="col-1"><i class="fa fa-times" aria-hidden="true"></i></div>' + '</div>';
        $('#chooseBonusProductModal .selected-bonus-products').append(selectedBonusProductHtml);
        $('.pre-cart-products').html(totalQty);
        $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
      } else {
        $('.selected-bonus-products .bonus-summary').addClass('alert-danger');
      }
    });
  },
  removeBonusProduct: function () {
    $(document).on('click', '.selected-pid', function () {
      $(this).remove();
      var $selected = $('#chooseBonusProductModal .selected-bonus-products .selected-pid');
      var count = 0;

      if ($selected.length) {
        $selected.each(function () {
          count += parseInt($(this).data('qty'), 10);
        });
      }

      $('.pre-cart-products').html(count);
      $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
    });
  },
  enableBonusProductSelection: function () {
    $('body').on('bonusproduct:updateSelectButton', function (e, response) {
      $('button.select-bonus-product', response.$productContainer).attr('disabled', !response.product.readyToOrder || !response.product.available);
      var pid = response.product.id;
      $('button.select-bonus-product', response.$productContainer).data('pid', pid);
    });
  },
  showMoreBonusProducts: function () {
    $(document).on('click', '.show-more-bonus-products', function () {
      var url = $(this).data('url');
      $('.modal-content').spinner().start();
      $.ajax({
        url: url,
        method: 'GET',
        success: function (html) {
          var parsedHtml = parseHtml(html);
          $('.modal-body').append(parsedHtml.body);
          $('.show-more-bonus-products:first').remove();
          $('.modal-content').spinner().stop();
        },
        error: function () {
          $('.modal-content').spinner().stop();
        }
      });
    });
  },
  addBonusProductsToCart: function () {
    $(document).on('click', '.add-bonus-products', function () {
      var $readyToOrderBonusProducts = $('.choose-bonus-product-dialog .selected-pid');
      var queryString = '?pids=';
      var url = $('.choose-bonus-product-dialog').data('addtocarturl');
      var pidsObject = {
        bonusProducts: []
      };
      $.each($readyToOrderBonusProducts, function () {
        var qtyOption = parseInt($(this).data('qty'), 10);
        var option = null;

        if (qtyOption > 0) {
          if ($(this).data('optionid') && $(this).data('option-selected-value')) {
            option = {};
            option.optionId = $(this).data('optionid');
            option.productId = $(this).data('pid');
            option.selectedValueId = $(this).data('option-selected-value');
          }

          pidsObject.bonusProducts.push({
            pid: $(this).data('pid'),
            qty: qtyOption,
            options: [option]
          });
          pidsObject.totalQty = parseInt($('.pre-cart-products').html(), 10);
        }
      });
      queryString += JSON.stringify(pidsObject);
      queryString = queryString + '&uuid=' + $('.choose-bonus-product-dialog').data('uuid');
      queryString = queryString + '&pliuuid=' + $('.choose-bonus-product-dialog').data('pliuuid');
      $.spinner().start();
      $.ajax({
        url: url + queryString,
        method: 'POST',
        success: function (data) {
          $.spinner().stop();

          if (data.error) {
            $('#chooseBonusProductModal').modal('hide');

            if ($('.add-to-cart-messages').length === 0) {
              $('body').append('<div class="add-to-cart-messages"></div>');
            }

            $('.add-to-cart-messages').append('<div class="alert alert-danger add-to-basket-alert text-center"' + ' role="alert">' + data.errorMessage + '</div>');
            setTimeout(function () {
              $('.add-to-basket-alert').remove();
            }, 3000);
          } else {
            $('.configure-bonus-product-attributes').html(data);
            $('.bonus-products-step2').removeClass('hidden-xl-down');
            $('#chooseBonusProductModal').modal('hide');

            if ($('.add-to-cart-messages').length === 0) {
              $('body').append('<div class="add-to-cart-messages"></div>');
            }

            $('.minicart-quantity').html(data.totalQty);
            $('.add-to-cart-messages').append('<div class="alert alert-success add-to-basket-alert text-center"' + ' role="alert">' + data.msgSuccess + '</div>');
            setTimeout(function () {
              $('.add-to-basket-alert').remove();

              if ($('.cart-page').length) {
                location.reload();
              }
            }, 1500);
          }
        },
        error: function () {
          $.spinner().stop();
        }
      });
    });
  },
  getPidValue: getPidValue,
  getQuantitySelected: getQuantitySelected,
  miniCartReportingUrl: miniCartReportingUrl
};

/***/ }),

/***/ "../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/util.js":
/*!***************************************************************************************************************!*\
  !*** ../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/util.js ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (include) {
  if (typeof include === 'function') {
    include();
  } else if (typeof include === 'object') {
    Object.keys(include).forEach(function (key) {
      if (typeof include[key] === 'function') {
        include[key]();
      }
    });
  }
};

/***/ }),

/***/ "./cartridges/int_affirm_sfra/cartridge/client/default/js/cart.js":
/*!************************************************************************!*\
  !*** ./cartridges/int_affirm_sfra/cartridge/client/default/js/cart.js ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var processInclude = __webpack_require__(/*! base/util */ "../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/util.js");

$(document).ready(function () {
  processInclude(__webpack_require__(/*! ./cart/cart */ "./cartridges/int_affirm_sfra/cartridge/client/default/js/cart/cart.js"));
});

/***/ }),

/***/ "./cartridges/int_affirm_sfra/cartridge/client/default/js/cart/cart.js":
/*!*****************************************************************************!*\
  !*** ./cartridges/int_affirm_sfra/cartridge/client/default/js/cart/cart.js ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var base = __webpack_require__(/*! base/product/base */ "../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/product/base.js");

var focusHelper = __webpack_require__(/*! base/components/focus */ "../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js/components/focus.js");
/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */


function appendToUrl(url, params) {
  var newUrl = url;
  newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');
  return newUrl;
}
/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */


function validateBasket(data) {
  if (data.valid.error) {
    if (data.valid.message) {
      var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' + 'fade show" role="alert">' + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' + '<span aria-hidden="true">&times;</span>' + '</button>' + data.valid.message + '</div>';
      $('.cart-error').append(errorHtml);
    } else {
      $('.cart').empty().append('<div class="row"> ' + '<div class="col-12 text-center"> ' + '<h1>' + data.resources.emptyCartMsg + '</h1> ' + '</div> ' + '</div>');
      $('.number-of-items').empty().append(data.resources.numberOfItems);
      $('.minicart-quantity').empty().append(data.numItems);
      $('.minicart-link').attr({
        'aria-label': data.resources.minicartCountOfItems,
        title: data.resources.minicartCountOfItems
      });
      $('.minicart .popover').empty();
      $('.minicart .popover').removeClass('show');
    }

    $('.checkout-btn').addClass('disabled');
  } else {
    $('.checkout-btn').removeClass('disabled');
  }
}
/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */


function updateCartTotals(data) {
  $('.number-of-items').empty().append(data.resources.numberOfItems);
  $('.shipping-cost').empty().append(data.totals.totalShippingCost);
  $('.tax-total').empty().append(data.totals.totalTax);
  $('.grand-total').empty().append(data.totals.grandTotal);
  $('.sub-total').empty().append(data.totals.subTotal);
  var totalCalculated = data.totals.grandTotal.substr(1);
  /* Affirm block for refreshing promo message */

  $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
  affirm.ui.refresh();
  $('.minicart-quantity').empty().append(data.numItems);
  $('.minicart-link').attr({
    'aria-label': data.resources.minicartCountOfItems,
    title: data.resources.minicartCountOfItems
  });

  if (data.totals.orderLevelDiscountTotal.value > 0) {
    $('.order-discount').removeClass('hide-order-discount');
    $('.order-discount-total').empty().append('- ' + data.totals.orderLevelDiscountTotal.formatted);
  } else {
    $('.order-discount').addClass('hide-order-discount');
  }

  if (data.totals.shippingLevelDiscountTotal.value > 0) {
    $('.shipping-discount').removeClass('hide-shipping-discount');
    $('.shipping-discount-total').empty().append('- ' + data.totals.shippingLevelDiscountTotal.formatted);
  } else {
    $('.shipping-discount').addClass('hide-shipping-discount');
  }

  data.items.forEach(function (item) {
    if (item.renderedPromotions) {
      $('.item-' + item.UUID).empty().append(item.renderedPromotions);
    }

    if (item.priceTotal && item.priceTotal.renderedPrice) {
      $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
    }
  });
}
/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */


function createErrorNotification(message) {
  var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' + 'fade show" role="alert">' + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' + '<span aria-hidden="true">&times;</span>' + '</button>' + message + '</div>';
  $('.cart-error').append(errorHtml);
}
/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */


function updateApproachingDiscounts(approachingDiscounts) {
  var html = '';
  $('.approaching-discounts').empty();

  if (approachingDiscounts.length > 0) {
    approachingDiscounts.forEach(function (item) {
      html += '<div class="single-approaching-discount text-center">' + item.discountMsg + '</div>';
    });
  }

  $('.approaching-discounts').append(html);
}
/**
 * Updates the availability of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */


function updateAvailability(data, uuid) {
  var lineItem;
  var messages = '';

  for (var i = 0; i < data.items.length; i++) {
    if (data.items[i].UUID === uuid) {
      lineItem = data.items[i];
      break;
    }
  }

  $('.availability-' + lineItem.UUID).empty();

  if (lineItem.availability) {
    if (lineItem.availability.messages) {
      lineItem.availability.messages.forEach(function (message) {
        messages += '<p class="line-item-attributes">' + message + '</p>';
      });
    }

    if (lineItem.availability.inStockDate) {
      messages += '<p class="line-item-attributes line-item-instock-date">' + lineItem.availability.inStockDate + '</p>';
    }
  }

  $('.availability-' + lineItem.UUID).html(messages);
}
/**
 * Finds an element in the array that matches search parameter
 * @param {array} array - array of items to search
 * @param {function} match - function that takes an element and returns a boolean indicating if the match is made
 * @returns {Object|null} - returns an element of the array that matched the query.
 */


function findItem(array, match) {
  for (var i = 0, l = array.length; i < l; i++) {
    if (match.call(this, array[i])) {
      return array[i];
    }
  }

  return null;
}
/**
 * Updates details of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */


function updateProductDetails(data, uuid) {
  var lineItem = findItem(data.cartModel.items, function (item) {
    return item.UUID === uuid;
  });

  if (lineItem.variationAttributes) {
    var colorAttr = findItem(lineItem.variationAttributes, function (attr) {
      return attr.attributeId === 'color';
    });

    if (colorAttr) {
      var colorSelector = '.Color-' + uuid;
      var newColor = 'Color: ' + colorAttr.displayValue;
      $(colorSelector).text(newColor);
    }

    var sizeAttr = findItem(lineItem.variationAttributes, function (attr) {
      return attr.attributeId === 'size';
    });

    if (sizeAttr) {
      var sizeSelector = '.Size-' + uuid;
      var newSize = 'Size: ' + sizeAttr.displayValue;
      $(sizeSelector).text(newSize);
    }

    var imageSelector = '.card.product-info.uuid-' + uuid + ' .item-image > img';
    $(imageSelector).attr('src', lineItem.images.small[0].url);
    $(imageSelector).attr('alt', lineItem.images.small[0].alt);
    $(imageSelector).attr('title', lineItem.images.small[0].title);
  }

  if (lineItem.options && lineItem.options.length) {
    var option = lineItem.options[0];
    var optSelector = '.lineItem-options-values[data-option-id="' + option.optionId + '"]';
    $(optSelector).data('value-id', option.selectedValueId);
    $(optSelector + ' .line-item-attributes').text(option.displayName);
  }

  var qtySelector = '.quantity[data-uuid="' + uuid + '"]';
  $(qtySelector).val(lineItem.quantity);
  $(qtySelector).data('pid', data.newProductId);
  $('.remove-product[data-uuid="' + uuid + '"]').data('pid', data.newProductId);
  var priceSelector = '.line-item-price-' + uuid + ' .sales .value';
  $(priceSelector).text(lineItem.price.sales.formatted);
  $(priceSelector).attr('content', lineItem.price.sales.decimalPrice);

  if (lineItem.price.list) {
    var listPriceSelector = '.line-item-price-' + uuid + ' .list .value';
    $(listPriceSelector).text(lineItem.price.list.formatted);
    $(listPriceSelector).attr('content', lineItem.price.list.decimalPrice);
  }
}
/**
 * Generates the modal window on the first call.
 *
 */


function getModalHtmlElement() {
  if ($('#editProductModal').length !== 0) {
    $('#editProductModal').remove();
  }

  var htmlString = '<!-- Modal -->' + '<div class="modal fade" id="editProductModal" tabindex="-1" role="dialog">' + '<span class="enter-message sr-only" ></span>' + '<div class="modal-dialog quick-view-dialog">' + '<!-- Modal content-->' + '<div class="modal-content">' + '<div class="modal-header">' + '    <button type="button" class="close pull-right" data-dismiss="modal">' + '        <span aria-hidden="true">&times;</span>' + '        <span class="sr-only"> </span>' + '    </button>' + '</div>' + '<div class="modal-body"></div>' + '<div class="modal-footer"></div>' + '</div>' + '</div>' + '</div>';
  $('body').append(htmlString);
}
/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */


function parseHtml(html) {
  var $html = $('<div>').append($.parseHTML(html));
  var body = $html.find('.product-quickview');
  var footer = $html.find('.modal-footer').children();
  return {
    body: body,
    footer: footer
  };
}
/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */


function fillModalElement(editProductUrl) {
  $('.modal-body').spinner().start();
  $.ajax({
    url: editProductUrl,
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      var parsedHtml = parseHtml(data.renderedTemplate);
      $('#editProductModal .modal-body').empty();
      $('#editProductModal .modal-body').html(parsedHtml.body);
      $('#editProductModal .modal-footer').html(parsedHtml.footer);
      $('#editProductModal .modal-header .close .sr-only').text(data.closeButtonText);
      $('#editProductModal .enter-message').text(data.enterDialogMessage);
      $('#editProductModal').modal('show');
      $.spinner().stop();
    },
    error: function () {
      $.spinner().stop();
    }
  });
}
/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 */


function confirmDelete(actionUrl, productID, productName, uuid) {
  var $deleteConfirmBtn = $('.cart-delete-confirmation-btn');
  var $productToRemoveSpan = $('.product-to-remove');
  $deleteConfirmBtn.data('pid', productID);
  $deleteConfirmBtn.data('action', actionUrl);
  $deleteConfirmBtn.data('uuid', uuid);
  $productToRemoveSpan.empty().append(productName);
}

module.exports = function () {
  $('body').on('click', '.remove-product', function (e) {
    e.preventDefault();
    var actionUrl = $(this).data('action');
    var productID = $(this).data('pid');
    var productName = $(this).data('name');
    var uuid = $(this).data('uuid');
    confirmDelete(actionUrl, productID, productName, uuid);
  });
  $('body').on('afterRemoveFromCart', function (e, data) {
    e.preventDefault();
    confirmDelete(data.actionUrl, data.productID, data.productName, data.uuid);
  });
  $('.optional-promo').click(function (e) {
    e.preventDefault();
    $('.promo-code-form').toggle();
  });
  $('body').on('click', '.cart-delete-confirmation-btn', function (e) {
    e.preventDefault();
    var productID = $(this).data('pid');
    var url = $(this).data('action');
    var uuid = $(this).data('uuid');
    var urlParams = {
      pid: productID,
      uuid: uuid
    };
    url = appendToUrl(url, urlParams);
    $('body > .modal-backdrop').remove();
    $.spinner().start();
    $.ajax({
      url: url,
      type: 'get',
      dataType: 'json',
      success: function (data) {
        if (data.basket.items.length === 0) {
          $('.cart').empty().append('<div class="row"> ' + '<div class="col-12 text-center"> ' + '<h1>' + data.basket.resources.emptyCartMsg + '</h1> ' + '</div> ' + '</div>');
          $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
          $('.minicart-quantity').empty().append(data.basket.numItems);
          $('.minicart-link').attr({
            'aria-label': data.basket.resources.minicartCountOfItems,
            title: data.basket.resources.minicartCountOfItems
          });
          $('.minicart .popover').empty();
          $('.minicart .popover').removeClass('show');
          $('body').removeClass('modal-open');
          $('html').removeClass('veiled');
        } else {
          if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
            for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
              $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
            }
          }

          $('.uuid-' + uuid).remove();

          if (!data.basket.hasBonusProduct) {
            $('.bonus-product').remove();
          }

          $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
          updateCartTotals(data.basket);
          updateApproachingDiscounts(data.basket.approachingDiscounts);
          $('body').trigger('setShippingMethodSelection', data.basket);
          validateBasket(data.basket);
        }

        $('body').trigger('cart:update');
        $.spinner().stop();
      },
      error: function (err) {
        if (err.responseJSON.redirectUrl) {
          window.location.href = err.responseJSON.redirectUrl;
        } else {
          createErrorNotification(err.responseJSON.errorMessage);
          $.spinner().stop();
        }
      }
    });
  });
  $('body').on('change', '.quantity-form > .quantity', function () {
    var preSelectQty = $(this).data('pre-select-qty');
    var quantity = $(this).val();
    var productID = $(this).data('pid');
    var url = $(this).data('action');
    var uuid = $(this).data('uuid');
    var urlParams = {
      pid: productID,
      quantity: quantity,
      uuid: uuid
    };
    url = appendToUrl(url, urlParams);
    $(this).parents('.card').spinner().start();
    $.ajax({
      url: url,
      type: 'get',
      context: this,
      dataType: 'json',
      success: function (data) {
        $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
        $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
        updateCartTotals(data);
        updateApproachingDiscounts(data.approachingDiscounts);
        updateAvailability(data, uuid);
        validateBasket(data);
        $(this).data('pre-select-qty', quantity);
        $('body').trigger('cart:update');
        $.spinner().stop();

        if ($(this).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
          location.reload();
        }
      },
      error: function (err) {
        if (err.responseJSON.redirectUrl) {
          window.location.href = err.responseJSON.redirectUrl;
        } else {
          createErrorNotification(err.responseJSON.errorMessage);
          $(this).val(parseInt(preSelectQty, 10));
          $.spinner().stop();
        }
      }
    });
  });
  $('.shippingMethods').change(function () {
    var url = $(this).attr('data-actionUrl');
    var urlParams = {
      methodID: $(this).find(':selected').attr('data-shipping-id')
    }; // url = appendToUrl(url, urlParams);

    $('.totals').spinner().start();
    $.ajax({
      url: url,
      type: 'post',
      dataType: 'json',
      data: urlParams,
      success: function (data) {
        if (data.error) {
          window.location.href = data.redirectUrl;
        } else {
          $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
          updateCartTotals(data);
          updateApproachingDiscounts(data.approachingDiscounts);
          validateBasket(data);
        }

        $.spinner().stop();
      },
      error: function (err) {
        if (err.redirectUrl) {
          window.location.href = err.redirectUrl;
        } else {
          createErrorNotification(err.responseJSON.errorMessage);
          $.spinner().stop();
        }
      }
    });
  });
  $('.promo-code-form').submit(function (e) {
    e.preventDefault();
    $.spinner().start();
    $('.coupon-missing-error').hide();
    $('.coupon-error-message').empty();

    if (!$('.coupon-code-field').val()) {
      $('.promo-code-form .form-control').addClass('is-invalid');
      $('.promo-code-form .form-control').attr('aria-describedby', 'missingCouponCode');
      $('.coupon-missing-error').show();
      $.spinner().stop();
      return false;
    }

    var $form = $('.promo-code-form');
    $('.promo-code-form .form-control').removeClass('is-invalid');
    $('.coupon-error-message').empty();
    $.ajax({
      url: $form.attr('action'),
      type: 'GET',
      dataType: 'json',
      data: $form.serialize(),
      success: function (data) {
        if (data.error) {
          $('.promo-code-form .form-control').addClass('is-invalid');
          $('.promo-code-form .form-control').attr('aria-describedby', 'invalidCouponCode');
          $('.coupon-error-message').empty().append(data.errorMessage);
        } else {
          $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
          updateCartTotals(data);
          updateApproachingDiscounts(data.approachingDiscounts);
          validateBasket(data);
        }

        $('.coupon-code-field').val('');
        $.spinner().stop();
      },
      error: function (err) {
        if (err.responseJSON.redirectUrl) {
          window.location.href = err.responseJSON.redirectUrl;
        } else {
          createErrorNotification(err.errorMessage);
          $.spinner().stop();
        }
      }
    });
    return false;
  });
  $('body').on('click', '.remove-coupon', function (e) {
    e.preventDefault();
    var couponCode = $(this).data('code');
    var uuid = $(this).data('uuid');
    var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
    var $productToRemoveSpan = $('.coupon-to-remove');
    $deleteConfirmBtn.data('uuid', uuid);
    $deleteConfirmBtn.data('code', couponCode);
    $productToRemoveSpan.empty().append(couponCode);
  });
  $('body').on('click', '.delete-coupon-confirmation-btn', function (e) {
    e.preventDefault();
    var url = $(this).data('action');
    var uuid = $(this).data('uuid');
    var couponCode = $(this).data('code');
    var urlParams = {
      code: couponCode,
      uuid: uuid
    };
    url = appendToUrl(url, urlParams);
    $('body > .modal-backdrop').remove();
    $.spinner().start();
    $.ajax({
      url: url,
      type: 'get',
      dataType: 'json',
      success: function (data) {
        $('.coupon-uuid-' + uuid).remove();
        updateCartTotals(data);
        updateApproachingDiscounts(data.approachingDiscounts);
        validateBasket(data);
        $.spinner().stop();
      },
      error: function (err) {
        if (err.responseJSON.redirectUrl) {
          window.location.href = err.responseJSON.redirectUrl;
        } else {
          createErrorNotification(err.responseJSON.errorMessage);
          $.spinner().stop();
        }
      }
    });
  });
  $('body').on('click', '.cart-page .bonus-product-button', function () {
    $.spinner().start();
    $(this).addClass('launched-modal');
    $.ajax({
      url: $(this).data('url'),
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        base.methods.editBonusProducts(data);
        $.spinner().stop();
      },
      error: function () {
        $.spinner().stop();
      }
    });
  });
  $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
    $('#chooseBonusProductModal').remove();
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open');

    if ($('.cart-page').length) {
      $('.launched-modal .btn-outline-primary').trigger('focus');
      $('.launched-modal').removeClass('launched-modal');
    } else {
      $('.product-detail .add-to-cart').focus();
    }
  });
  $('body').on('click', '.cart-page .product-edit .edit, .cart-page .bundle-edit .edit', function (e) {
    e.preventDefault();
    var editProductUrl = $(this).attr('href');
    getModalHtmlElement();
    fillModalElement(editProductUrl);
  });
  $('body').on('shown.bs.modal', '#editProductModal', function () {
    $('#editProductModal').siblings().attr('aria-hidden', 'true');
    $('#editProductModal .close').focus();
  });
  $('body').on('hidden.bs.modal', '#editProductModal', function () {
    $('#editProductModal').siblings().attr('aria-hidden', 'false');
  });
  $('body').on('keydown', '#editProductModal', function (e) {
    var focusParams = {
      event: e,
      containerSelector: '#editProductModal',
      firstElementSelector: '.close',
      lastElementSelector: '.update-cart-product-global',
      nextToLastElementSelector: '.modal-footer .quantity-select'
    };
    focusHelper.setTabNextFocus(focusParams);
  });
  $('body').on('product:updateAddToCart', function (e, response) {
    // update global add to cart (single products, bundles)
    var dialog = $(response.$productContainer).closest('.quick-view-dialog');
    $('.update-cart-product-global', dialog).attr('disabled', !$('.global-availability', dialog).data('ready-to-order') || !$('.global-availability', dialog).data('available'));
  });
  $('body').on('product:updateAvailability', function (e, response) {
    // bundle individual products
    $('.product-availability', response.$productContainer).data('ready-to-order', response.product.readyToOrder).data('available', response.product.available).find('.availability-msg').empty().html(response.message);
    var dialog = $(response.$productContainer).closest('.quick-view-dialog');

    if ($('.product-availability', dialog).length) {
      // bundle all products
      var allAvailable = $('.product-availability', dialog).toArray().every(function (item) {
        return $(item).data('available');
      });
      var allReady = $('.product-availability', dialog).toArray().every(function (item) {
        return $(item).data('ready-to-order');
      });
      $('.global-availability', dialog).data('ready-to-order', allReady).data('available', allAvailable);
      $('.global-availability .availability-msg', dialog).empty().html(allReady ? response.message : response.resources.info_selectforstock);
    } else {
      // single product
      $('.global-availability', dialog).data('ready-to-order', response.product.readyToOrder).data('available', response.product.available).find('.availability-msg').empty().html(response.message);
    }
  });
  $('body').on('product:afterAttributeSelect', function (e, response) {
    if ($('.modal.show .product-quickview .bundle-items').length) {
      $('.modal.show').find(response.container).data('pid', response.data.product.id);
      $('.modal.show').find(response.container).find('.product-id').text(response.data.product.id);
    } else {
      $('.modal.show .product-quickview').data('pid', response.data.product.id);
    }
  });
  $('body').on('change', '.quantity-select', function () {
    var selectedQuantity = $(this).val();
    $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
  });
  $('body').on('change', '.options-select', function () {
    var selectedOptionValueId = $(this).children('option:selected').data('value-id');
    $('.modal.show .update-cart-url').data('selected-option', selectedOptionValueId);
  });
  $('body').on('click', '.update-cart-product-global', function (e) {
    e.preventDefault();
    var updateProductUrl = $(this).closest('.cart-and-ipay').find('.update-cart-url').val();
    var selectedQuantity = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-quantity');
    var selectedOptionValueId = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-option');
    var uuid = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('uuid');
    var form = {
      uuid: uuid,
      pid: base.getPidValue($(this)),
      quantity: selectedQuantity,
      selectedOptionValueId: selectedOptionValueId
    };
    $(this).parents('.card').spinner().start();

    if (updateProductUrl) {
      $.ajax({
        url: updateProductUrl,
        type: 'post',
        context: this,
        data: form,
        dataType: 'json',
        success: function (data) {
          $('#editProductModal').modal('hide');
          $('.coupons-and-promos').empty().append(data.cartModel.totals.discountsHtml);
          updateCartTotals(data.cartModel);
          updateApproachingDiscounts(data.cartModel.approachingDiscounts);
          updateAvailability(data.cartModel, uuid);
          updateProductDetails(data, uuid);

          if (data.uuidToBeDeleted) {
            $('.uuid-' + data.uuidToBeDeleted).remove();
          }

          validateBasket(data.cartModel);
          $('body').trigger('cart:update');
          $.spinner().stop();
        },
        error: function (err) {
          if (err.responseJSON.redirectUrl) {
            window.location.href = err.responseJSON.redirectUrl;
          } else {
            createErrorNotification(err.responseJSON.errorMessage);
            $.spinner().stop();
          }
        }
      });
    }
  });
  base.selectAttribute();
  base.colorAttribute();
  base.removeBonusProduct();
  base.selectBonusProduct();
  base.enableBonusProductSelection();
  base.showMoreBonusProducts();
  base.addBonusProductsToCart();
  base.focusChooseBonusProductModal();
  base.trapChooseBonusProductModalFocus();
  base.onClosingChooseBonusProductModal();
};

/***/ })

/******/ });
//# sourceMappingURL=cart.js.map