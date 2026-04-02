document.addEventListener("DOMContentLoaded", function () {
    const xRange = document.getElementById("subgrad-x-range");
    const gRange = document.getElementById("subgrad-g-range");
    const yRange = document.getElementById("subgrad-y-range");

    const xDisplay = document.getElementById("subgrad-x-display");
    const setDisplay = document.getElementById("subgrad-set-display");
    const gDisplay = document.getElementById("subgrad-g-display");
    const validDisplay = document.getElementById("subgrad-valid-display");
    const yDisplay = document.getElementById("subgrad-y-display");
    const ineqDisplay = document.getElementById("subgrad-ineq-display");

    if (!xRange || !gRange || !yRange) {
        return;
    }

    function subdiffText(x) {
        const eps = 1e-9;
        if (x > eps) {
            return "{1}";
        }
        if (x < -eps) {
            return "{-1}";
        }
        return "[-1, 1]";
    }

    function isValidSubgradient(x, g) {
        const eps = 1e-9;
        if (x > eps) {
            return Math.abs(g - 1) < eps;
        }
        if (x < -eps) {
            return Math.abs(g + 1) < eps;
        }
        return g >= -1 - eps && g <= 1 + eps;
    }

    function update() {
        const x = parseFloat(xRange.value);
        const g = parseFloat(gRange.value);
        const y = parseFloat(yRange.value);

        const lhs = Math.abs(y);
        const rhs = Math.abs(x) + g * (y - x);
        const ineqHolds = lhs + 1e-9 >= rhs;
        const valid = isValidSubgradient(x, g);

        xDisplay.textContent = `x = ${x.toFixed(1)}`;
        setDisplay.textContent = `Subdifferential at x: ∂|x| = ${subdiffText(x)}`;
        gDisplay.textContent = `Chosen candidate g = ${g.toFixed(1)}`;
        validDisplay.textContent = valid
            ? "This g is a valid subgradient at x."
            : "This g is NOT a valid subgradient at x.";

        yDisplay.textContent = `Test point y = ${y.toFixed(1)}`;
        ineqDisplay.textContent = `Check: |y| = ${lhs.toFixed(3)} and |x| + g(y-x) = ${rhs.toFixed(3)}. Inequality holds: ${ineqHolds ? "yes" : "no"}.`;
    }

    xRange.addEventListener("input", update);
    gRange.addEventListener("input", update);
    yRange.addEventListener("input", update);
    update();
});
