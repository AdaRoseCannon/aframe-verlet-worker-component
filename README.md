# aframe-verlet-worker-component
AFrame component for Performant Verlet Integration using Web Workers

Usage add the script tag to the head of your document after the A-Frame script, e.g.

```html
<script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>
<script src="https://aframe.io/releases/0.4.0/aframe.min.js"></script>
<script src="https://rawgit.com/AdaRoseEdwards/aframe-verlet-worker-component/master/build/verlet-component.js"></script>
```

# Contributing

Open to new issues and pull requests.

# Components and Primitives

```html
<!-- verlet point, position is got from position component -->
<a-box id="p1" verlet-point color="skyblue" position="0 3 0"></a-box>


<!-- verlet point, with options, position is got from position component -->
<a-box id="p2" verlet-point="mass:2; velocity: 0.1 0.1 -0.1;" position=" 0 2 0" color="maroon"></a-box>

<!-- verlet point, with options, has a verlet constraint to attach it to another point -->
<a-box id="p3" verlet-point="mass:1;position: 0 1 0;" verlet-constraint="to: #myAnchor2; stiffness: 0.01; distance: 1;" color="orange"></a-box>

<!-- verlet point, with mass 0 are immovable -->
<a-box id="myAnchor1" verlet-point="mass: 0;" color="green"  position="-1 5 0"></a-box>
<a-box id="myAnchor2" verlet-point="mass: 0;" color="pink"  position="1 5 0"></a-box>


<!-- you can define constraints between multiple points. -->
<a-verlet-constraint from="#myAnchor1" to="#p1, #p2" stiffness="0.03" distance="2"></a-verlet-constraint>
```

# About

Uses https://github.com/mattdesl/verlet-system under the hood.
