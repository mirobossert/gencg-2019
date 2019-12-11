/*
f number of floors
1 Floor:        5.85
2 Floors:       8.38
3 Floors:       10.88
4 Floors:       13.38
5 Floors:       15.88
6 Floors:       18.38
7 Floors:       20.88
8 Floors:       23.38
*/
export const getRideDuration = (f) => {
  return [5.85, 8.38, 10.88, 13.38, 15.88, 18.38, 20.88, 23.38][f];
};

/*
http://robertpenner.com/easing/
https://easings.net/en
t is current time
b is start value
c is change in value
d is duration
*/
function linear(t, b, c, d) {
  return c * (t /= d) * t + b;
}

function easeInQuad(t, b, c, d) {
  return c * (t /= d) * t + b;
}

function easeOutQuad(t, b, c, d) {
  return -c * (t /= d) * (t - 2) + b;
}

function easeInOutQuad(t, b, c, d) {
  if ((t /= d / 2) < 1) return c / 2 * t * t + b;
  return c / 2 * ((t -= 2) * t * t + 2) + b;
}

function easeInSine(t, b, c, d) {
  return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
}

function easeOutSine(t, b, c, d) {
  return c * Math.sin(t / d * (Math.PI / 2)) + b;
}

function easeInOutSine(t, b, c, d) {
  return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
}

/*
t is current time
b is start value
c is change in value
rd is ride duration
td is transition duration
*/
export const simulateRide = (t, b, c, rd, td) => {
  if (t < td) return easeInQuad(t, b, c, td);
  else if (t < (rd - td)) return c;
  else if (t < rd) return c - easeOutQuad(t - (rd - td), b, c, td);
  else if (t > rd) return 0;
  // const distance = endValue - startValue;
  // if (time < transitionDuration) {
  //   // return step * distance;
  //   const step = time / transitionDuration;
  //   console.log(easeInQuad(time, startValue, 1, transitionDuration));
  //   return (easeInQuad(time, startValue, step, transitionDuration) / transitionDuration) * distance;
  // } else if (time <= rideDuration) {
  //   const step = time / (rideDuration - transitionDuration);
  //   return step * distance;
  // } else {
  //   return distance;
  // }
};
