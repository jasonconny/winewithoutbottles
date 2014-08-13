// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require_tree .

var WWOB = WWOB || {};

WWOB.mainHeader = $("header h1");
WWOB.navToggle = $(".toggle-nav");
WWOB.infoToggle = $(".toggle-info");
WWOB.mainImg = $("article img");

WWOB.init = function() {
	WWOB.sizeImg();
};

WWOB.sizeImg = function() {
	winHeight = $(window).height();
	winWidth = $(window).width();
	$(WWOB.mainImg).css({
		height: winHeight,
		width: winWidth
	});
};


$(document).ready(function() {

	// WWOB.init();

	$(WWOB.infoToggle).on('click', function(e) {
		e.preventDefault();
		$('body').toggleClass('show-info');
	});

	$(WWOB.navToggle).on('click', function(e) {
		e.preventDefault();
		$('body').toggleClass('show-nav');
	});

	window.setTimeout(function(){
		WWOB.mainHeader.fadeOut(5000);
	}, 5000);

});