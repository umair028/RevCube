// The RevCube site behaviour: [data-mailto] blocks open email, the nav dot follows the current item,
// and the footer clock runs on the office's time zone (data-tz on the clock block).
// Elements are looked up on every use because Barba page transitions swap the page content.
(function () {
  // Opened straight from disk, browsers block Barba's history updates, so links do normal page loads.
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) { a.setAttribute('data-barba-prevent', 'self'); });
  }
  // Barba changes the URL without reloading <head>; pin icon links to absolute URLs so they keep resolving.
  document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(function (l) { l.setAttribute('href', l.href); });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-mailto]');
    if (!el) return;
    // A real link inside the block (e.g. a secondary button) handles its own click.
    var link = e.target.closest('a');
    if (link && el.contains(link)) return;
    e.preventDefault();
    window.location.href = el.getAttribute('data-mailto');
  });

  // Nav dot: the page's own item (Home, or Services on a service page) unless a section with its own
  // nav link is on screen: on the home page About -> About Us and Featured Work -> Our Work;
  // the footer contact details -> Contact.
  function updateNavDot() {
    var mains = document.querySelectorAll('main[data-barba-namespace]');
    if (!mains.length) return;
    var main = mains[mains.length - 1];
    var key = main.getAttribute('data-barba-namespace') === 'home' ? 'home' : 'services';
    var line = window.innerHeight * 0.4;
    var contact = main.querySelector('#contact');
    if (key === 'home') {
      [['about', 'about-us'], ['work', 'our-work']].forEach(function (pair) {
        var el = main.querySelector('#' + pair[0]);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) key = pair[1];
      });
    }
    if (contact && contact.getBoundingClientRect().top < window.innerHeight * 0.85) key = 'contact';
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.classList.toggle('is-current', el.getAttribute('data-nav') === key);
    });
  }
  var navDotQueued = false;
  window.addEventListener('scroll', function () {
    if (navDotQueued) return;
    navDotQueued = true;
    requestAnimationFrame(function () { navDotQueued = false; updateNavDot(); });
  }, { passive: true });

  // Industries slider: the remote script starts Swiper with the default 3s pause between slides;
  // shorten it once the slider exists (checked each second, so it also catches Barba page swaps).
  var SLIDER_DELAY_MS = 2000;
  function tuneSlider() {
    var el = document.querySelector('.panorama-slider .swiper');
    var sw = el && el.swiper;
    if (!sw || !sw.autoplay || sw.__revcubeTuned) return;
    sw.__revcubeTuned = true;
    sw.params.autoplay.delay = SLIDER_DELAY_MS;
    sw.autoplay.stop();
    sw.autoplay.start();
  }

  var DEFAULT_TZ = 'America/New_York';
  var OPEN_HOUR = 9, CLOSE_HOUR = 18;

  function tick() {
    var now = new Date();
    var block = document.querySelector('[la-availability][data-tz]');
    var TZ = (block && block.getAttribute('data-tz')) || DEFAULT_TZ;
    var time = now.toLocaleTimeString('en-US', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.querySelectorAll('[la-time]').forEach(function (c) { c.textContent = time; });
    var hour = parseInt(now.toLocaleString('en-US', { timeZone: TZ, hour12: false, hour: '2-digit' }), 10) % 24;
    document.querySelectorAll('[la-availability]').forEach(function (s) {
      s.classList.toggle('online', hour >= OPEN_HOUR && hour < CLOSE_HOUR);
    });
    // Also catches Barba page swaps, which don't fire a scroll event.
    updateNavDot();
    tuneSlider();
  }
  tick();
  setInterval(tick, 1000);
})();
