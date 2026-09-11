function restoreDefaultCalculatorHeader(){
  document.querySelector('#ff-calculator-header-theme')?.remove();
}

restoreDefaultCalculatorHeader();
requestAnimationFrame(restoreDefaultCalculatorHeader);
setTimeout(restoreDefaultCalculatorHeader,0);
