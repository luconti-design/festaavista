// jsdom does not implement the native dialog top layer. Browser QA covers it.
if(!HTMLDialogElement.prototype.showModal){
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
}
