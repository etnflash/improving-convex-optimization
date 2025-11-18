document.addEventListener("DOMContentLoaded", function () {
    const thetaSlider = document.getElementById("theta-range");
    const thetaValue = document.getElementById("theta-value");
    const zValue = document.getElementById("z-value");
    const fzValue = document.getElementById("fz-value");
    const convexIneq = document.getElementById("convex-ineq");

    // Fixed points x and y
    const x = -1;
    const y = 2;

    // Convex function: f(x) = x^2
    function f(t) {
        return t * t;
    }

    function update() {
        const theta = parseFloat(thetaSlider.value);
        const z = theta * x + (1 - theta) * y;
        const fz = f(z);
        const lhs = fz; // f(z)
        const rhs = theta * f(x) + (1 - theta) * f(y);

        thetaValue.textContent = `θ = ${theta.toFixed(2)}`;
        zValue.textContent = `z = θx + (1−θ)y = ${z.toFixed(3)}`;
        fzValue.textContent = `f(z) = z² = ${fz.toFixed(3)}`;
        convexIneq.textContent =
            `θ f(x) + (1−θ) f(y) = ${rhs.toFixed(3)}, so f(z) ≤ θ f(x) + (1−θ) f(y).`;
    }

    thetaSlider.addEventListener("input", update);
    update();
});
