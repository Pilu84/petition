(function() {
    const canvas = $("#canvsign");
    const ctx = document.getElementById("canvsign").getContext("2d");
    var draw = false;
    var hidden = $("input[name='sign']");

    canvas.on("mousedown", e => {
        draw = true;

        addClick(e.offsetX, e.offsetY);

        sign();
    });

    canvas.on("mousemove", e => {
        if (draw) {
            addClick(e.offsetX, e.offsetY, true);
        }
        sign();
    });

    canvas.on("mouseup", () => {
        draw = false;
    });

    var clickX = [];
    var clickY = [];
    var clickDrag = [];

    function addClick(x, y, dragging) {
        clickX.push(x);
        clickY.push(y);
        clickDrag.push(dragging);
    }

    function sign() {
        ctx.strokeStyle = "black";
        ctx.lineWidth = "1";

        for (var i = 0; i < clickX.length; i++) {
            ctx.beginPath();
            if (clickDrag[i]) {
                ctx.moveTo(clickX[i - 1], clickY[i - 1]);
            } else {
                ctx.moveTo(clickX[i] - 1, clickY[i]);
            }
            ctx.lineTo(clickX[i], clickY[i]);
            ctx.stroke();
        }
        let canvText = document.getElementById("canvsign").toDataURL();
        hidden.val(canvText);
    }
})();
