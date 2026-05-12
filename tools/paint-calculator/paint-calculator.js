/* ============================================
   Paint Coverage Calculator — Logic
   ============================================ */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return document.querySelectorAll(s)};

var mode='room',coats=2,wastage=5,surfaceCount=1;
var selectedTins={5:true};
var coverageRates={'standard':10,'premium':12,'gloss':14,'masonry':8,'textured':6,'primer':8};

document.addEventListener('DOMContentLoaded',function(){
  $$('.mode-pill').forEach(function(p){p.addEventListener('click',function(){setMode(p.dataset.mode)})});
  $$('.coat-btn').forEach(function(b){b.addEventListener('click',function(){setCoats(parseInt(b.dataset.value))})});
  $$('.wastage-btn').forEach(function(b){b.addEventListener('click',function(){setWastage(parseInt(b.dataset.value))})});
  $$('.tin-chip').forEach(function(c){c.addEventListener('click',function(){toggleTinSize(parseFloat(c.dataset.size))})});
  var cb=$('#calcBtn');if(cb)cb.addEventListener('click',calculate);
  var cp=$('#copyBtn');if(cp)cp.addEventListener('click',copyResults);
  var pr=$('#printBtn');if(pr)pr.addEventListener('click',function(){window.print()});
  var ab=$('#addSurfaceBtn');if(ab)ab.addEventListener('click',addSurface);
  var dt=$('#deductionsToggle');if(dt)dt.addEventListener('click',function(){
    var body=$('#deductionsBody');var arrow=$('#dedArrow');
    if(body.style.display==='none'){body.style.display='';arrow.textContent='\u25BE'}
    else{body.style.display='none';arrow.textContent='\u25B8'}
  });
  var cs=$('#coverageSelect');if(cs)cs.addEventListener('change',function(){
    var ci=$('#coverageInput');
    if(cs.value==='custom'){ci.removeAttribute('readonly');ci.focus()}
    else{ci.setAttribute('readonly','');ci.value=coverageRates[cs.value]||10}
    liveUpdate();
  });
  /* Checkboxes */
  $$('.surface-checkbox-row input[type=checkbox]').forEach(function(cb){cb.addEventListener('change',liveUpdate)});
  /* Live update all inputs */
  document.addEventListener('input',function(e){if(e.target.matches('.form-input,.form-select'))liveUpdate()});
  setMode('room');initFAQ();
});

function setMode(m){
  mode=m;
  $$('.mode-pill').forEach(function(p){p.classList.toggle('active',p.dataset.mode===m)});
  $$('.mode-panel').forEach(function(p){p.classList.toggle('active',p.id==='mode-'+m)});
  var rb=$('.result-box');if(rb)rb.classList.remove('visible');
  liveUpdate();
}

function setCoats(n){coats=n;$$('.coat-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.dataset.value)===n)});liveUpdate()}
function setWastage(v){wastage=v;$$('.wastage-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.dataset.value)===v)});liveUpdate()}

function toggleTinSize(size){
  selectedTins[size]=!selectedTins[size];
  $$('.tin-chip').forEach(function(c){c.classList.toggle('active',!!selectedTins[parseFloat(c.dataset.size)])});
}

function addSurface(){
  if(surfaceCount>=10)return;
  surfaceCount++;
  var container=$('#extSurfaces');
  var row=document.createElement('div');row.className='surface-row';row.dataset.idx=surfaceCount;
  row.innerHTML='<div class="form-group"><input class="form-input" type="text" placeholder="Surface '+surfaceCount+'" value="Surface '+surfaceCount+'"></div>'+
    '<div class="form-group"><label class="form-label">Width (m)</label><input class="form-input" type="number" value="5" min="0.1" step="0.1"></div>'+
    '<div class="form-group"><label class="form-label">Height (m)</label><input class="form-input" type="number" value="3" min="0.1" step="0.1"></div>'+
    '<button class="remove-surface-btn" type="button">&times;</button>';
  row.querySelector('.remove-surface-btn').addEventListener('click',function(){row.remove();surfaceCount--;liveUpdate()});
  container.appendChild(row);
  liveUpdate();
}

function removeSurface(btn){btn.closest('.surface-row').remove();surfaceCount--;liveUpdate()}

function liveUpdate(){
  /* Update area displays */
  if(mode==='room'){
    var rl=parseFloat($('#roomL').value)||0;
    var rw=parseFloat($('#roomW').value)||0;
    var rh=parseFloat($('#roomH').value)||0;
    var wallA=2*(rl+rw)*rh;
    var ceilA=rl*rw;
    var floorA=rl*rw;
    var wDisp=$('#wallAreaDisp');if(wDisp)wDisp.textContent=wallA.toFixed(1)+' m\u00B2';
    var cDisp=$('#ceilAreaDisp');if(cDisp)cDisp.textContent=ceilA.toFixed(1)+' m\u00B2';
  }
  if($('.result-box')&&$('.result-box').classList.contains('visible'))calculate();
}

function getGrossArea(){
  var area=0;
  if(mode==='wall'){
    var w=parseFloat($('#wallW').value)||0;
    var h=parseFloat($('#wallH').value)||0;
    area=w*h;
  } else if(mode==='room'){
    var rl=parseFloat($('#roomL').value)||0;
    var rw=parseFloat($('#roomW').value)||0;
    var rh=parseFloat($('#roomH').value)||0;
    var walls=$('#chkWalls');var ceil=$('#chkCeil');var floor=$('#chkFloor');
    if(walls&&walls.checked)area+=2*(rl+rw)*rh;
    if(ceil&&ceil.checked)area+=rl*rw;
    if(floor&&floor.checked)area+=rl*rw;
  } else if(mode==='exterior'){
    var rows=$$('#extSurfaces .surface-row');
    rows.forEach(function(r){
      var inputs=r.querySelectorAll('input[type=number]');
      if(inputs.length>=2){
        var sw=parseFloat(inputs[0].value)||0;
        var sh=parseFloat(inputs[1].value)||0;
        area+=sw*sh;
      }
    });
  }
  return area;
}

function getWallArea(){
  if(mode!=='room')return 0;
  var rl=parseFloat($('#roomL').value)||0;
  var rw=parseFloat($('#roomW').value)||0;
  var rh=parseFloat($('#roomH').value)||0;
  return 2*(rl+rw)*rh;
}
function getCeilArea(){
  if(mode!=='room')return 0;
  var rl=parseFloat($('#roomL').value)||0;
  var rw=parseFloat($('#roomW').value)||0;
  var ceil=$('#chkCeil');
  return(ceil&&ceil.checked)?rl*rw:0;
}

function calculate(){
  var grossArea=getGrossArea();
  var doors=parseInt($('#doorCount').value)||0;
  var windows=parseInt($('#winCount').value)||0;
  var manualDed=parseFloat($('#manualDed').value)||0;
  var deductions=doors*1.8+windows*1.2+manualDed;
  var netArea=Math.max(grossArea-deductions,0);
  var coverage=parseFloat($('#coverageInput').value)||10;
  var litresPerCoat=netArea/coverage;
  var totalLitres=litresPerCoat*coats*(1+wastage/100);

  $('#resNetArea').textContent=netArea.toFixed(1);
  $('#resPerCoat').textContent=litresPerCoat.toFixed(1);
  $('#resPerCoatSub').textContent='At '+coverage+' m\u00B2 per litre';
  $('#resTotalLitres').textContent=totalLitres.toFixed(1);
  $('#resTotalSub').textContent=coats+' coat'+(coats>1?'s':'')+' + '+wastage+'% wastage';

  /* Tin breakdown */
  var tinGrid=$('#tinBreakdown');
  tinGrid.innerHTML='';
  var sizes=[1,2.5,4,5,10,15,20];
  sizes.forEach(function(s){
    if(!selectedTins[s])return;
    var tins=Math.ceil(totalLitres/s);
    var total=tins*s;
    var item=document.createElement('div');item.className='tin-breakdown-item';
    item.innerHTML='<div class="tin-breakdown-num">'+tins+'</div><div class="tin-breakdown-lbl">'+s+'L tins ('+total+'L)</div>';
    tinGrid.appendChild(item);
  });

  /* Room-specific cards */
  var wallCard=$('#resWallCard');
  var ceilCard=$('#resCeilCard');
  if(mode==='room'){
    if(wallCard){wallCard.style.display='';$('#resWallArea').textContent=getWallArea().toFixed(1)}
    if(ceilCard){ceilCard.style.display='';$('#resCeilArea').textContent=getCeilArea().toFixed(1)}
  } else {
    if(wallCard)wallCard.style.display='none';
    if(ceilCard)ceilCard.style.display='none';
  }

  var rb=$('.result-box');rb.classList.add('visible');
  rb.scrollIntoView({behavior:'smooth',block:'start'});
}

function copyResults(){
  var t='Paint Calculation\n'+
    'Net Area: '+($('#resNetArea')||{}).textContent+' m\u00B2\n'+
    'Per Coat: '+($('#resPerCoat')||{}).textContent+' litres\n'+
    'Total: '+($('#resTotalLitres')||{}).textContent+' litres\n'+
    coats+' coats, '+wastage+'% wastage\n'+
    '\nCalculated at BuildCalcTools.site';
  navigator.clipboard.writeText(t).then(function(){
    var b=$('#copyBtn');var o=b.textContent;b.textContent='\u2713 Copied!';setTimeout(function(){b.textContent=o},2500);
  });
}

function initFAQ(){
  $$('.faq-question').forEach(function(q){
    q.addEventListener('click',function(){
      var was=q.classList.contains('open');
      $$('.faq-question').forEach(function(qq){qq.classList.remove('open');qq.querySelector('.faq-arrow').textContent='\u25B8'});
      $$('.faq-answer').forEach(function(a){a.classList.remove('open')});
      if(!was){q.classList.add('open');q.querySelector('.faq-arrow').textContent='\u25BE';q.nextElementSibling.classList.add('open')}
    });
  });
}
})();
