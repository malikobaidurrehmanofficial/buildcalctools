/* ============================================
   Excavation Calculator — Logic
   ============================================ */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return document.querySelectorAll(s)};

var unit='metric',wastage=5,currentTab='trench';
var soilData={
  rock:{swell:32,shrink:24,density:2000,label:'Rock'},
  hardclay:{swell:25,shrink:20,density:1800,label:'Hard Clay'},
  medclay:{swell:17,shrink:15,density:1700,label:'Medium Clay'},
  sandyclay:{swell:12,shrink:11,density:1750,label:'Sandy Clay'},
  sand:{swell:7,shrink:7,density:1600,label:'Sand'},
  topsoil:{swell:20,shrink:17,density:1400,label:'Topsoil'}
};
var currentSoil='medclay';
var FT3_PER_M3=35.3147;var M_PER_FT=0.3048;

document.addEventListener('DOMContentLoaded',function(){
  $$('.calc-tab').forEach(function(t){t.addEventListener('click',function(){switchTab(t.dataset.tab)})});
  $$('.unit-pill[data-unit]').forEach(function(p){p.addEventListener('click',function(){setUnit(p.dataset.unit)})});
  $$('.wastage-btn').forEach(function(b){b.addEventListener('click',function(){setWastage(parseInt(b.dataset.value))})});
  $$('.soil-card').forEach(function(c){c.addEventListener('click',function(){setSoilType(c.dataset.soil)})});
  var cb=$('#calcBtn');if(cb)cb.addEventListener('click',calculate);
  var cp=$('#copyBtn');if(cp)cp.addEventListener('click',copyResults);
  var pr=$('#printBtn');if(pr)pr.addEventListener('click',function(){window.print()});
  $$('.tab-panel input,.tab-panel select').forEach(function(el){
    el.addEventListener('input',function(){if($('.result-box')&&$('.result-box').classList.contains('visible'))calculate()});
  });
  switchTab('trench');setSoilType('medclay');initFAQ();
});

function setUnit(u){
  unit=u;
  $$('.unit-pill[data-unit]').forEach(function(p){p.classList.toggle('active',p.dataset.unit===u)});
  $$('[data-label-metric]').forEach(function(el){el.textContent=u==='metric'?el.dataset.labelMetric:el.dataset.labelImperial});
  if($('.result-box')&&$('.result-box').classList.contains('visible'))calculate();
}

function switchTab(id){
  currentTab=id;
  $$('.calc-tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===id)});
  $$('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='panel-'+id)});
  var rb=$('.result-box');if(rb)rb.classList.remove('visible');
}

function setSoilType(type){
  currentSoil=type;
  $$('.soil-card').forEach(function(c){c.classList.toggle('active',c.dataset.soil===type)});
  var d=soilData[type];
  var si=$('#swellInput');if(si)si.value=d.swell;
  var sh=$('#shrinkInput');if(sh)sh.value=d.shrink;
  if($('.result-box')&&$('.result-box').classList.contains('visible'))calculate();
}

function setWastage(v){
  wastage=v;
  $$('.wastage-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.dataset.value)===v)});
  if($('.result-box')&&$('.result-box').classList.contains('visible'))calculate();
}

function validateInputs(){
  var valid=true;var panel=$('#panel-'+currentTab);if(!panel)return false;
  panel.querySelectorAll('.field-error-msg').forEach(function(e){e.classList.remove('visible')});
  panel.querySelectorAll('.form-input').forEach(function(i){i.style.borderColor=''});
  panel.querySelectorAll('input[type="number"]').forEach(function(inp){
    if(inp.classList.contains('readonly-field'))return;
    var v=parseFloat(inp.value);
    if(isNaN(v)||v<0){inp.style.borderColor='var(--color-primary)';var err=inp.parentElement.querySelector('.field-error-msg');if(err)err.classList.add('visible');valid=false;}
  });
  return valid;
}

function calculate(){
  if(!validateInputs())return;
  var isM=unit==='metric';
  var toM=function(v){return isM?v:v*M_PER_FT};
  var swell=parseFloat($('#swellInput').value)||0;
  var shrink=parseFloat($('#shrinkInput').value)||0;
  var truckCap=parseFloat($('#truckCap').value)||5;
  var bankVol=0,cutVol=0,fillVol=0,topL=0,topW=0,showTopDims=false;

  switch(currentTab){
    case 'trench':{
      var L=toM(parseFloat($('#trL').value)||0);
      var W=toM(parseFloat($('#trW').value)||0);
      var D=toM(parseFloat($('#trD').value)||0);
      var Q=parseInt($('#trQ').value)||1;
      bankVol=L*W*D*Q;break;
    }
    case 'pit':{
      var Lb=toM(parseFloat($('#pitL').value)||0);
      var Wb=toM(parseFloat($('#pitW').value)||0);
      var D=toM(parseFloat($('#pitD').value)||0);
      var slope=parseFloat($('#pitSlope').value)||0;
      var setback=D*slope;
      topL=Lb+2*setback;topW=Wb+2*setback;
      var Abottom=Lb*Wb;var Atop=topL*topW;
      var Amid=((Lb+topL)/2)*((Wb+topW)/2);
      bankVol=D/6*(Abottom+Atop+4*Amid);
      showTopDims=true;break;
    }
    case 'basement':{
      var L=toM(parseFloat($('#bsL').value)||0);
      var W=toM(parseFloat($('#bsW').value)||0);
      var D=toM(parseFloat($('#bsD').value)||0);
      bankVol=L*W*D;break;
    }
    case 'sloped':{
      var L=toM(parseFloat($('#slL').value)||0);
      var W=toM(parseFloat($('#slW').value)||0);
      var cutD=toM(parseFloat($('#slCut').value)||0);
      var fillD=toM(parseFloat($('#slFill').value)||0);
      cutVol=L*W*cutD;fillVol=L*W*fillD;
      bankVol=cutVol;break;
    }
  }

  var looseVol=bankVol*(1+swell/100)*(1+wastage/100);
  var compactedVol=bankVol*(1-shrink/100);
  var trucks=Math.ceil(looseVol/truckCap);
  var density=soilData[currentSoil].density;
  var weightT=bankVol*density/1000;

  if(isM){
    $('#resBankVol').textContent=bankVol.toFixed(2);$('#resBankUnit').textContent='m\u00B3';
    $('#resLooseVol').textContent=looseVol.toFixed(2);$('#resLooseUnit').textContent='m\u00B3';
    $('#resCompactVol').textContent=compactedVol.toFixed(2);$('#resCompactUnit').textContent='m\u00B3';
  } else {
    var bft=bankVol*FT3_PER_M3;var lft=looseVol*FT3_PER_M3;var cft=compactedVol*FT3_PER_M3;
    $('#resBankVol').textContent=bft.toFixed(1);$('#resBankUnit').textContent='ft\u00B3';
    $('#resLooseVol').textContent=lft.toFixed(1);$('#resLooseUnit').textContent='ft\u00B3';
    $('#resCompactVol').textContent=cft.toFixed(1);$('#resCompactUnit').textContent='ft\u00B3';
  }
  $('#resLooseSub').textContent='Volume after excavation (+'+swell+'% swell)';
  $('#resTrucks').textContent=trucks;
  $('#resTruckSub').textContent='Based on '+truckCap+' m\u00B3 per truck (loose)';
  $('#resWeight').textContent=weightT.toFixed(2);

  var topCard=$('#resTopDims');
  if(topCard){
    if(showTopDims){
      topCard.style.display='';
      $('#resTopVal').textContent=(isM?topL.toFixed(2):(topL/M_PER_FT).toFixed(1))+' \u00D7 '+(isM?topW.toFixed(2):(topW/M_PER_FT).toFixed(1));
      $('#resTopUnit').textContent=isM?'m':'ft';
    } else { topCard.style.display='none'; }
  }

  if(currentTab==='sloped'){
    $('#resBankSub').textContent='Cut volume (average cut depth)';
    var fc=$('#resFillCard');if(fc){fc.style.display='';
      var fv=fillVol*(1+swell/100);
      $('#resFillVol').textContent=isM?fv.toFixed(2):(fv*FT3_PER_M3).toFixed(1);
      $('#resFillUnit').textContent=isM?'m\u00B3':'ft\u00B3';
    }
  } else {
    $('#resBankSub').textContent='Natural ground before excavation';
    var fc=$('#resFillCard');if(fc)fc.style.display='none';
  }

  var rb=$('.result-box');rb.classList.add('visible');
  rb.scrollIntoView({behavior:'smooth',block:'start'});
}

function copyResults(){
  var t='Excavation Calculation\n'+
    'Bank Volume: '+($('#resBankVol')||{}).textContent+' '+($('#resBankUnit')||{}).textContent+'\n'+
    'Loose Volume: '+($('#resLooseVol')||{}).textContent+' '+($('#resLooseUnit')||{}).textContent+'\n'+
    'Compacted: '+($('#resCompactVol')||{}).textContent+' '+($('#resCompactUnit')||{}).textContent+'\n'+
    'Truck Loads: '+($('#resTrucks')||{}).textContent+'\n'+
    'Weight: '+($('#resWeight')||{}).textContent+' tonnes\n'+
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
