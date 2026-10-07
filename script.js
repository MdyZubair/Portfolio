(function () {
  var pages = [].slice.call(document.querySelectorAll('.page'));
  var nav = document.getElementById('nav');
  var cur = 0;

  /* ---- page navigation ---- */
  nav.innerHTML =
    '<button class="back" id="back" aria-label="Go back" hidden>' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>' +
    '</button><b>Mohamed Zubair Y</b>';
  document.getElementById('back').onclick = function () { if (cur > 0) show(cur - 1); };
  pages.forEach(function (p, i) {
    var b = document.createElement('button');
    b.className = 'tab';
    b.textContent = p.dataset.t;
    b.onclick = function () { show(i); };
    nav.appendChild(b);
  });
  function show(i) {
    cur = i;
    pages.forEach(function (p, j) { p.classList.toggle('on', j === i); });
    [].slice.call(nav.querySelectorAll('button.tab')).forEach(function (b, j) {
      b.setAttribute('aria-current', j === i);
    });
    document.getElementById('back').hidden = i === 0;
    document.getElementById('prev').disabled = i === 0;
    document.getElementById('next').disabled = i === pages.length - 1;
    window.scrollTo(0, 0);
  }
  document.getElementById('prev').onclick = function () { show(cur - 1); };
  document.getElementById('next').onclick = function () { show(cur + 1); };
  [].forEach.call(document.querySelectorAll('[data-go]'), function (b) {
    b.onclick = function () { show(+b.dataset.go); };
  });

  /* ---- lightbox ---- */
  var lb = document.getElementById('lb');
  var lbImg = lb.querySelector('img');
  lb.onclick = function () { lb.classList.remove('on'); };
  function openImage(src) { lbImg.src = src; lb.classList.add('on'); }

  /* ---- image galleries ----
     Folder names: images/cad and images/autocad
     File names:   image1.jpg, image2.jpg, image3.jpg ... (no spaces)
     Supported:    jpg, jpeg, png, webp
     Loading stops at the first number that is missing, so keep numbers in order. */
  var EXTS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  var MAX = 100;

  function tryLoad(folder, n, k, done) {
    if (k >= EXTS.length) { done(null); return; }
    var src = folder + '/' + (typeof n === 'number' ? 'image' + n : n) + '.' + EXTS[k];
    var im = new Image();
    im.onload = function () { done(im); };
    im.onerror = function () { tryLoad(folder, n, k + 1, done); };
    im.src = src;
  }

  var ARROW_L = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var ARROW_R = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  var active = null; /* gallery currently on screen */

  function loadGallery(folder, box) {
    var label = folder.indexOf('autocad') > -1 ? 'AutoCAD drawing' : 'CAD design';
    box.innerHTML =
      '<div class="stage" hidden>' +
        '<img alt="">' +
        '<button class="arrow prev" aria-label="Previous image">' + ARROW_L + '</button>' +
        '<button class="arrow next" aria-label="Next image">' + ARROW_R + '</button>' +
        '<div class="count" aria-live="polite"></div>' +
      '</div>' +
      '<div class="thumbs" hidden></div>' +
      '<div class="empty" hidden>No images found in ' + folder + '. Add image1.jpg, image2.jpg and so on.</div>';

    var stage = box.querySelector('.stage');
    var big = stage.querySelector('img');
    var prev = stage.querySelector('.prev');
    var next = stage.querySelector('.next');
    var count = stage.querySelector('.count');
    var thumbs = box.querySelector('.thumbs');
    var srcs = [], idx = 0;

    function go(i) {
      if (!srcs.length) return;
      idx = (i + srcs.length) % srcs.length;
      big.src = srcs[idx];
      big.alt = label + ' ' + (idx + 1);
      count.textContent = (idx + 1) + ' / ' + srcs.length;
      [].forEach.call(thumbs.children, function (t, j) {
        t.setAttribute('aria-current', j === idx);
        if (j === idx) thumbs.scrollTo({ left: t.offsetLeft - (thumbs.clientWidth - t.offsetWidth) / 2 });
      });
    }
    function refreshControls() {
      var many = srcs.length > 1;
      prev.hidden = next.hidden = count.hidden = !many;
      thumbs.hidden = !many;
    }

    big.onclick = function () { openImage(big.src); };
    prev.onclick = function () { go(idx - 1); };
    next.onclick = function () { go(idx + 1); };

    /* swipe on touch screens */
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 45) go(dx < 0 ? idx + 1 : idx - 1);
    });

    box.step = function (d) { go(idx + d); };
    (function loadNext(n) {
      if (n > MAX) return;
      tryLoad(folder, n, 0, function (im) {
        if (!im) { if (n === 1) box.querySelector('.empty').hidden = false; return; }
        srcs.push(im.src);
        var t = document.createElement('button');
        t.setAttribute('aria-label', 'Show image ' + n);
        var ti = new Image(); ti.src = im.src; ti.alt = '';
        t.appendChild(ti);
        t.onclick = (function (k) { return function () { go(k); }; })(srcs.length - 1);
        thumbs.appendChild(t);
        if (n === 1) { stage.hidden = false; go(0); }
        refreshControls();
        count.textContent = (idx + 1) + ' / ' + srcs.length;
        loadNext(n + 1);
      });
    })(1);
  }

  /* keyboard: left / right arrows move through the open gallery */
  document.addEventListener('keydown', function (e) {
    if (!active || !active.step || !pages[cur].contains(active)) return;
    if (e.key === 'ArrowLeft') active.step(-1);
    if (e.key === 'ArrowRight') active.step(1);
  });

  /* ---- CAD / AutoCAD links ---- */
  var picks = [].slice.call(document.querySelectorAll('[data-g]'));
  var loaded = {};
  picks.forEach(function (b) {
    b.onclick = function () {
      var willOpen = b.getAttribute('aria-expanded') !== 'true';
      picks.forEach(function (x) {
        var on = x === b && willOpen;
        x.setAttribute('aria-expanded', on);
        document.getElementById(x.dataset.g).classList.toggle('on', on);
      });
      document.getElementById('hint').style.display = willOpen ? 'none' : '';
      active = willOpen ? document.getElementById(b.dataset.g) : null;
      if (willOpen && !loaded[b.dataset.g]) {
        loaded[b.dataset.g] = true;
        loadGallery(b.dataset.folder, document.getElementById(b.dataset.g));
      }
    };
  });

  /* ---- profile photo: images/profile.jpg (or .jpeg, .png, .webp) ---- */
  tryLoad('images', 'profile', 0, function (im) {
    if (!im) return;
    var photo = document.getElementById('photo');
    photo.src = im.src;
    photo.hidden = false;
    document.getElementById('ini').hidden = true;
  });

  show(0);
})();
