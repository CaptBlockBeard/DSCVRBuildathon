"use client"
import p5 from 'p5';

export default function mySketch(p, username) {
    p.setup = function () {
      p.createCanvas(800, 600);
      console.log("Username:", username);
    };

    const str = username;
  let hash = 0;
  str.split('').forEach(char => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  })
  let colorStr = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    colorStr += value.toString(16).padStart(2, '0')
  }
  
  
    p.draw = function () {
      p.background(colorStr);
      p5.text(`Hello, ${username}`, 10, 10);
      p.ellipse(p.width / 2, p.height / 2, 50, 50);
    };
  }