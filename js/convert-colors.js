export const hsv2hsl = (hue, sat, val) => {
  // [hue, saturation, lightness]
  return [
    //Range should be between 0 - 1
    hue, //Hue stays the same

    //Saturation is very different between the two color spaces
    //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
    //Otherwise sat*val/(2-(2-sat)*val)
    //Conditional is not operating with hue, it is reassigned!
    sat * val / ((hue = (2 - sat) * val) < 1 ? hue : 2 - hue),

    hue / 2 //Lightness is (2-sat)*val/2
    //See reassignment of hue above
  ];
}

export const hsl2hsv = (hue,sat,light) => {
  sat*=light<.5?light:1-light;

  //[hue, saturation, value]
  return[
    //Range should be between 0 - 1

    hue, //Hue stays the same
    2*sat/(light+sat), //Saturation
    light+sat //Value
  ]
}
