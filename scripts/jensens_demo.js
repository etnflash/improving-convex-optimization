document.addEventListener("DOMContentLoaded", function () {
    const x1Range = document.getElementById("jensen-x1-range");
    const x2Range = document.getElementById("jensen-x2-range");
    const thetaRange = document.getElementById("jensen-theta-range");

    const paramsDisplay = document.getElementById("jensen-params-display");
    const exDisplay = document.getElementById("jensen-ex-display");
    const lhsDisplay = document.getElementById("jensen-lhs-display");
    const rhsDisplay = document.getElementById("jensen-rhs-display");
    const resultDisplay = document.getElementById("jensen-result-display");

    if (!x1Range || !x2Range || !thetaRange) {
        return;
    }

    function f(x) {
        return x * x;
    }

    function update() {
        const x1 = parseFloat(x1Range.value);
        const x2 = parseFloat(x2Range.value);
        const theta = parseFloat(thetaRange.value);

        const ex = theta * x1 + (1 - theta) * x2;
        const lhs = f(ex);
        const rhs = theta * f(x1) + (1 - theta) * f(x2);
        const holds = lhs <= rhs + 1e-9;

        paramsDisplay.textContent = `x1 = ${x1.toFixed(1)}, x2 = ${x2.toFixed(1)}, theta = ${theta.toFixed(2)}`;
        exDisplay.textContent = `E[X] = theta x1 + (1-theta) x2 = ${ex.toFixed(3)}`;
        lhsDisplay.textContent = `LHS: f(E[X]) = (E[X])^2 = ${lhs.toFixed(4)}`;
        rhsDisplay.textContent = `RHS: E[f(X)] = theta x1^2 + (1-theta) x2^2 = ${rhs.toFixed(4)}`;
        resultDisplay.textContent = `Jensen check: f(E[X]) <= E[f(X)] is ${holds ? "true" : "false"}.`;
    }

    x1Range.addEventListener("input", update);
    x2Range.addEventListener("input", update);
    thetaRange.addEventListener("input", update);
    update();
});
