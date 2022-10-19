import $ from 'jquery';

$(".header-menu > .close-button").click(function() {
	$(".header-menu").addClass("-closed");
});

$(".header-menu > .logo-wrapper").click(function() {
	$(".header-menu").removeClass("-closed");
});

$(".main-nav > .item").click(function() {
	let el = $(this);
	let index = el.data("index");

	if (this.classList.contains("-active")) {
		$(".main-nav > .item").toggleClass("-show");
	} else {
		$(".main-nav > .item").removeClass("-show");
		$(".main-nav > .item").removeClass("-active");
		el.addClass("-active");
		$(".sub-nav-wrapper > .sub-nav").removeClass("-active");
		$(".sub-nav-wrapper > .sub-nav:nth-child(" + index + ")").addClass("-active");
	}
});