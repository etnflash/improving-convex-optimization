# improving-convex-optimization
An open educational website that explains convex optimization through clear intuition, visual examples, and accessible mathematics.

## Project Structure

```
├── index.html                       # Main landing page (Hero, Getting Started, About)
├── css/
│   └── style.css                   # Responsive layout + diagram/card styles
├── topics/
│   ├── index.html                 # Topics hub
│   ├── convexity.html             # Understanding convex sets
│   ├── convex-functions.html      # Convex functions lesson + slider demo
│   ├── strong-convexity-smoothness.html # Curvature bounds, conditioning, and rate intuition
│   ├── accelerated-gradient-methods.html # Nesterov/FISTA-style acceleration concepts
│   ├── subgradients-optimality.html # Non-smooth convexity + first-order optimality
│   ├── jensens-inequality.html    # Jensen's inequality and expectation bounds
│   ├── conjugate-fenchel-duality.html # Convex conjugates and Fenchel dual formulations
│   ├── kkt-slater-conditions.html # KKT optimality system and Slater regularity condition
│   ├── proximal-operators-moreau.html # Prox maps, Moreau envelope, and decomposition
│   ├── mirror-descent-bregman.html # Geometry-aware updates via Bregman divergence
│   ├── admm-splitting.html         # Alternating direction method for split objectives
│   ├── primal-dual-methods.html    # PDHG/Chambolle-Pock updates and residual diagnostics
│   ├── projected-gradient-descent.html # Projection-based first-order constrained optimization
│   ├── line-search-methods.html    # Armijo/Wolfe step-size selection and backtracking logic
│   ├── projection-library.html    # Projection operators for common convex constraint sets
│   ├── feasibility-projection-algorithms.html # POCS/Dykstra for convex-set intersection feasibility
│   ├── interior-point-methods.html # Barrier + Newton central-path optimization methods
│   ├── conic-optimization.html     # LP/QP/SOCP/SDP unified via cone constraints
│   ├── convergence-rates.html      # Sublinear/accelerated/linear convergence regime comparison
│   ├── operator-splitting-methods.html # Forward-backward and DR-style splitting foundations
│   ├── solver-engineering-practice.html # Practical stopping, scaling, and warm-start tactics
│   ├── stochastic-gradient-methods.html # SGD, mini-batch, and variance-reduction foundations
│   ├── variance-reduction-methods.html # SVRG/SAGA-style variance reduction on finite sums
│   ├── coordinate-descent.html      # Coordinate-wise and block coordinate optimization
│   ├── regularization-paths.html  # Coefficient trajectories across regularization strengths
│   ├── optimization-diagnostics.html # Multi-metric monitoring for optimization convergence
│   ├── convex-optimization.html   # Convex optimization problems overview
│   └── algorithms-duality.html    # Algorithms and duality lesson
├── scripts/
│   ├── convex_functions.js        # Interactive inequality demo
│   ├── strong_convexity_demo.js   # Interactive condition-number vs convergence simulator
│   ├── accelerated_methods_demo.js # Interactive GD vs Nesterov objective comparison
│   ├── subgradients_demo.js       # Interactive subgradient inequality checker
│   ├── jensens_demo.js            # Interactive Jensen inequality checker
│   ├── kkt_slater_demo.js         # Interactive KKT residual and active-constraint checker
│   ├── admm_demo.js               # Interactive ADMM primal-dual residual checker
│   ├── primal_dual_demo.js        # Interactive PDHG residual and gap-style dashboard
│   ├── projected_gd_demo.js       # Interactive 2D projected gradient path visualizer
│   ├── line_search_demo.js        # Interactive fixed-step vs Armijo backtracking comparison
│   ├── feasibility_projection_demo.js # Interactive POCS vs Dykstra trajectory comparison
│   ├── interior_point_demo.js     # Interactive central-path gap decay simulation
│   ├── conic_optimization_demo.js # Interactive LP/QP/SOCP/SDP model trade-off explorer
│   ├── convergence_rates_demo.js  # Interactive asymptotic rate curve comparator
│   ├── operator_splitting_demo.js # Interactive splitting residual behavior visualizer
│   ├── solver_engineering_demo.js # Interactive practical solver tuning dashboard
│   ├── stochastic_demo.js         # Interactive mini-batch convergence comparison
│   ├── variance_reduction_demo.js # Interactive SGD vs SVRG finite-sum comparison
│   ├── coordinate_demo.js         # Interactive cyclic vs randomized coordinate comparison
│   ├── projection_library_demo.js # Interactive projection explorer across common sets
│   ├── regularization_path_demo.js # Interactive L1/L2/elastic coefficient path visualizer
│   ├── diagnostics_dashboard_demo.js # Interactive multi-metric convergence dashboard simulator
│   └── topics_index_summary.js    # Auto-count demo badges on topics index
├── images/                        # Placeholder for future diagrams/assets
├── LICENSE
└── README.md
```

## Features

- **Clean Landing Page**: Welcome section, getting started guide, and about information
- **Navigation Bar**: Sticky navigation with Home, Topics, and About links
- **Responsive Design**: Mobile-first design that adapts to different screen sizes
- **MathJax Support**: Renders mathematical equations beautifully
- **Educational Content**: 
  - Convexity lesson with definitions, examples, and inline SVG diagrams
  - Convex Functions lesson featuring chord tests, epigraph diagrams, and a numeric slider demo
  - Strong convexity/smoothness lesson linking condition numbers with practical convergence rates
  - Accelerated methods lesson comparing gradient descent and Nesterov momentum behavior
  - Subgradients & optimality lesson covering subdifferentials and soft-thresholding intuition
  - Jensen's inequality lesson connecting convexity to expectation and averaging bounds
  - Conjugate/Fenchel lesson covering conjugates, Fenchel-Young, and dual model templates
  - KKT/Slater lesson covering primal-dual certificates and regularity assumptions for strong duality
  - Proximal/Moreau lesson covering prox updates, envelopes, and decomposition identities
  - Mirror descent lesson covering Bregman divergence and non-Euclidean updates
  - ADMM lesson covering augmented Lagrangians, splitting, and residual diagnostics
  - Primal-dual methods lesson covering PDHG/Chambolle-Pock updates and stability criteria
  - Projected gradient lesson covering constrained updates, projection maps, and step-size tactics
  - Line-search lesson covering Armijo backtracking and adaptive step selection criteria
  - Projection library lesson covering reusable operators for box, ball, simplex, and affine sets
  - Feasibility/projection lesson covering POCS and Dykstra on convex set intersections
  - Interior-point lesson covering barriers, central path, and Newton/KKT solves
  - Conic optimization lesson covering LP/QP/SOCP/SDP modeling choices and cone geometry
  - Convergence-rates lesson comparing O(1/sqrt(k)), O(1/k), O(1/k^2), and linear regimes
  - Operator-splitting lesson covering forward-backward and Douglas-Rachford-style updates
  - Solver-engineering lesson covering scaling, warm-start quality, and practical stopping rules
  - Stochastic gradient lesson covering SGD, mini-batch scaling, and variance-reduction intuition
  - Variance-reduction lesson covering SVRG/SAGA-style finite-sum stochastic stabilization
  - Coordinate descent lesson covering cyclic/random updates and sparse optimization workflows
  - Regularization path lesson covering coefficient trajectories for L1/L2/elastic penalties
  - Diagnostics dashboard lesson covering objective/residual/gap monitoring in one place
  - Convex Optimization Problems topic tying objectives + feasible sets together
  - Algorithms & duality walkthrough covering KKT conditions, dual construction, and solver playbook
  - Topics landing page with cards that surface available modules

## Getting Started

1. Open `index.html` in a web browser to view the website
2. Navigate to Topics to choose any lesson (Convexity, Convex Functions, Strong Convexity & Smoothness, Accelerated Gradient Methods, Subgradients & Optimality, Jensen's Inequality, Conjugate Functions & Fenchel Duality, KKT and Slater Conditions, Proximal Operators & Moreau Envelope, Mirror Descent & Bregman Divergence, ADMM, Primal-Dual Methods, Projected Gradient Descent, Line Search Methods, Projection Library for Convex Sets, Feasibility & Projection Algorithms, Interior-Point Methods, Conic Optimization, Convergence Rates, Operator Splitting Methods, Solver Engineering Practice, Stochastic Gradient Methods, Variance Reduction Methods, Coordinate Descent, Regularization Paths, Optimization Diagnostics Dashboard, Convex Optimization Problems)
3. All content is static HTML/CSS - no build process required

## Future Expansion

The structure is ready for:
- More interactive demos (projection visualizer, gradient steps, etc.)
- Additional topic pages (subgradients, duality, algorithms)
- Community contributions via lightweight HTML/CSS/JS
- Richer illustrations in the `images/` folder if/when needed
