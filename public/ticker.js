(function() {
    $.ajax({
        url: "datalink.json",
        method: "GET",
        success: function(data) {
            var linkText = "";
            for (var i = 0; i < data.length; i++) {
                linkText +=
                    '<a href="' +
                    data[i].url_link +
                    '" target="_blank" class="tweet">' +
                    data[i].linkname +
                    "</a>";
            }

            $("#headlines").html(linkText);
        }
    });

    var elem = $("#headlines");
    var links = $(".tweet");
    var animId;

    var left = elem.offset().left;

    function moveHeadlines() {
        left--;

        if (left < -links.eq(0).outerWidth()) {
            left += links.eq(0).outerWidth();
            elem.append(links.eq(0));
            links = $(".tweet");
        }

        elem.css("left", left + "px");

        animId = requestAnimationFrame(moveHeadlines);
    }

    moveHeadlines();

    elem.on("mouseover", function() {
        cancelAnimationFrame(animId);
    });

    elem.on("mouseleave", function() {
        requestAnimationFrame(moveHeadlines);
    });
})();
