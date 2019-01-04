const hmenu = $(".hmenu");
const menu = $("#menu");

menu.on("click", () => {
    hmenu.addClass("active");
});

hmenu.on("mouseleave", () => {
    hmenu.removeClass("active");
});
