import $ from 'jquery';

$(".header-menu > .close-button").click(function() {
	$(".header-menu").addClass("-closed");
});

$(".main-nav > .item:not(.-active)").click(function() {
	let el = $(this);
	let subnavId = el.data("id");

	$(".main-nav > .item").removeClass("-show");
	$(".main-nav > .item").removeClass("-active");
	el.addClass("-active");
	$(".sub-nav-wrapper > .sub-nav").removeClass("-active");
	$("#" + subnavId).addClass("-active");
});

$(".main-nav > .item.-active").click(function() {
	$(".main-nav > .item").addClass("-show");
});