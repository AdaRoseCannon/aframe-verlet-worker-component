---
---

# Demos


## Simple

[Link](simple.html)

An example of connecting a few shapes, then breaking those connections with JavaScript


## Luftballons

[Link](luftballons.html)

This demo is a performance test

99 Balloons 9900 connections. Each balloon is set to not interesect with the others and to stay tethered to the floor.

Everynow and then I delete one of the connections to the floor and the balloon drifts up into the sky.


## UI

[Link](ui.html)

This demo is to show using the system to pick up objects and put them down again.

Also how to dynamically make connections between objects.

<script>
	Array.prototype.forEach.call(document.querySelectorAll('a'), function (a) {
		a.target = '#target';
	});
</script>

<iframe width="100%" height="100%" src="about:blank"></iframe>