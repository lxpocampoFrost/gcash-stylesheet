import $ from 'jquery';
import 'slick-carousel';
import 'rangeslider.js';
import flatpickr from 'flatpickr';

// DATA TOGGLE AND PERSONALIZATION
let enable = $('.data-personalization >.main >input:checkbox');
let dataCheckbox = $('.data-personalization >.item >input:checkbox');

// add multiple select/unselect function
enable.on('change', function() {
	dataCheckbox.prop('checked', $(this).prop('checked'));
});

// if all checkbox are selected, check the selectall checkbox
dataCheckbox.on('change', function() {
	let getChecked = dataCheckbox.filter(':checked').length;

	if ($(this).prop('checked') == false) {
		enable.prop('checked', false);
	}
	if (getChecked == dataCheckbox.length) {
		enable.prop('checked', true);
	}
});

//range slider
var rangeSlider = $('input[type="range"]') as any;

rangeSlider.rangeslider({
	polyfill: false,

	// Default CSS classes
	rangeClass: 'rangeslider',
	disabledClass: 'rangeslider--disabled',
	horizontalClass: 'rangeslider--horizontal',
	fillClass: 'rangeslider__fill',
	handleClass: 'rangeslider__handle',

	// Callback function
	onInit: function() {
		var $rangeEl = this.$range;
		// add value label to handle
		var $handle = $rangeEl.find('.rangeslider__handle');

		var handleValue =
			'<div class="rangeslider__handle__value text-label-small">' +
			this.value +
			'</div>';
		$handle.append(handleValue);

		// get range index labels
		var rangeLabels = this.$element.attr('labels');
		rangeLabels = rangeLabels.split(', ');

		// add labels
		$rangeEl.append('<div class="rangeslider__labels"></div>');
		$(rangeLabels).each(function(index, value) {
			$rangeEl
				.find('.rangeslider__labels')
				.append(
					'<span class="rangeslider__labels__label"><span class="percent">' +
						value +
						'%</span></span>'
				);
		});
	},

	// Callback function
	onSlide: function(position, value) {
		if (value === 100) {
			$('.rangeslider__handle').css('left', position + 3);
		} else if (value > 50) {
			$('.rangeslider__handle').css('left', position - 7);
		} else if (value === 0) {
			$('.rangeslider__handle').css('left', position - 6);
		} else {
			$('.rangeslider__handle').css('left', position - 4);
		}
		var $handle = this.$range.find('.rangeslider__handle__value');
		$handle.text(this.value);
	},
});
$('.rangeslider__handle').css('left', '-5px');

//Schedule transfers accordion

$('.schedule-transfers.-w-list > .accordion > .header').on('click', function() {
	$(this)
		.parent('.accordion')
		.toggleClass('-hide');
});

// CAMPAIGN CAROUSEL
(<any>$('.carousel-wrapper')).slick({
	speed: 300,
	slidesToShow: 1,
	variableWidth: true,
	infinite: false,
});

// Banner Carousel

(<any>$('.carousel')).slick({
	infinite: true,
	speed: 300,
	slidesToShow: 1,
	centerMode: true,
});

// Form Field [ Allow only numbers, comma and decimal ]

function formatNumber(n) {
	// format number 1000000 to 1,234,567
	return n.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatCurrency(input, blur) {
	let input_val = input.val();

	// Hide placeholder once field has value
	input_val !== ''
		? $('.placeholder > .amount').addClass('-hide')
		: $('.placeholder > .amount').removeClass('-hide');

	// original length
	let original_len = input_val.length;

	// initial caret position
	let caret_pos = input.prop('selectionStart');

	// check for decimal
	if (input_val.indexOf('.') >= 0) {
		// get position of first decimal
		// this prevents multiple decimals from
		// being entered
		var decimal_pos = input_val.indexOf('.');

		// split number by decimal point
		var left_side = input_val.substring(0, decimal_pos);
		var right_side = input_val.substring(decimal_pos);

		// add commas to left side of number
		left_side = formatNumber(left_side);

		// validate right side
		right_side = formatNumber(right_side);

		// On blur make sure 2 numbers after decimal
		if (blur === 'blur') {
			right_side += '00';
		}

		// Limit decimal to only 2 digits
		right_side = right_side.substring(0, 2);

		// join number by .
		input_val = left_side + '.' + right_side;
	} else {
		// no decimal entered
		// add commas to number
		// remove all non-digits
		input_val = formatNumber(input_val);
		input_val = input_val;

		// final formatting
		if (blur === 'blur' && input_val !== '') {
			input_val += '.00';
		}
	}

	// send updated string to input
	input.val(input_val);

	// put caret back in the right position
	var updated_len = input_val.length;
	caret_pos = updated_len - original_len + caret_pos;
	input[0].setSelectionRange(caret_pos, caret_pos);
}

$('.amount').on({
	keyup: function() {
		formatCurrency($(this), 'keyup');
	},
	blur: function() {
		formatCurrency($(this), 'blur');
	},
});

//DATE PICKER-----
flatpickr('.date-picker', {
	dateFormat: 'm/d/Y',
	monthSelectorType: 'static',
	wrap: true,
	locale: {
		firstDayOfWeek: 1, // start week on Monday
	},
	onChange: function(selectedDates, dateStr, instance) {
		instance.todayDateElem.classList.remove('today');
	},
});

var i;
for (i = 0; i < 7; i++) {
	//make weekdays two letters
	if (i === 3 || i === 5 || i === 6) {
		$('.flatpickr-weekday')[i].textContent = $('.flatpickr-weekday')
			[i].textContent.replace(/\s/g, '')
			.slice(0, 2);
	} else {
		$('.flatpickr-weekday')[i].textContent = $('.flatpickr-weekday')
			[i].textContent.replace(/\s/g, '')
			.slice(0, 1);
	}
}
//kkb-form with tag
var amountWithTag = $('#amount-w-tag') as any;
var valueWithTag = $('#value-w-tag span') as any;
valueWithTag.text('0.00');

amountWithTag.on({
	keyup: function() {
		formatCurrency($(this), 'keyup');
		let input = $(this).val() as any;

		if (input.length > 0) {
			valueWithTag.text(input + '.00');
			if (input.indexOf('.') !== -1) {
				valueWithTag.contents().remove();
				valueWithTag.text(input);
			}
		} else {
			valueWithTag.text('0.00');
		}
	},
});

//kkb-form without tag
var amountWithoutTag = $('#amount-wo-tag');
var valueWithoutTag = $('#value-wo-tag span') as any;
valueWithoutTag.text('0.00');

amountWithoutTag.on({
	keyup: function() {
		formatCurrency($(this), 'keyup');
		let input = $(this).val() as any;

		if (input.length > 0) {
			valueWithoutTag.text(input + '.00');
			if (input.indexOf('.') !== -1) {
				valueWithoutTag.contents().remove();
				valueWithoutTag.text(input);
			}
		} else {
			valueWithoutTag.text('0.00');
		}
	},
});

//accounts-balance
$('.accounts-balance .header').on('click', headerOnClick);

function headerOnClick() {
	let body = $(this)
		.siblings()
		.slideToggle('200');

	$(this).toggleClass('-hide');
	body.toggleClass('-hide');
}

//format mobile number
formatMobileNumber();

function formatMobileNumber() {
	$('.mobile-number').each(function() {
		var myStr = $(this).text();
		var first = myStr.substring(0, 3);
		var second = myStr.substring(3, 6);
		var third = myStr.substring(6, 11);
		var fourth = myStr.substring(11, 13);

		third = third.replace(third, '••• ••');

		$(this).text(first + ' ' + second + ' ' + third + fourth);
	});
}
