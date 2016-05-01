var zepto = require('zepto-browserify').Zepto;

// Show and hide mobile nav
zepto(function() {
	var elToggleNav = zepto('.mobile-nav-burger');
	var elNavItems = zepto('nav.main');
	var otherTriggers = zepto('.show-contact-modal button');

	function toggleMobileNav() {
	  elNavItems.toggleClass('shown');
	};

	otherTriggers.on('click', function(){
		zepto(document.body).trigger('nav:selected');
	});

	elToggleNav.on('click', toggleMobileNav);
	// Global event fired by navSelectScroll to hide the nav when on mobile
	zepto(document.body).on('nav:selected', toggleMobileNav);
});
