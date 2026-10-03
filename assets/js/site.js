(function () {
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    var header = document.querySelector('.site-header');
    var sentinel = document.querySelector('.header-sentinel');
    if (!header || !sentinel || !('IntersectionObserver' in window)) return;

    // Set the restored-scroll state before transitions are enabled.
    header.classList.toggle('is-compact', window.scrollY > 140);

    new IntersectionObserver(function (entries) {
        var entry = entries[0];
        if (!entry) return;
        header.classList.toggle('is-compact', !entry.isIntersecting);
        header.classList.add('is-ready');
    }).observe(sentinel);
}());
