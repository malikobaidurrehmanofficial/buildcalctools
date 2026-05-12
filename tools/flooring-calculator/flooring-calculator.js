/* ============================================
   Flooring Calculator — Logic
   ============================================ */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return document.querySelectorAll(s)};

var currentTab='tiles',roomShape='rect',areaMode='single',orientation='straight';
var wastage={tiles:10,laminate:5,hardwood:8};
var areaCount=1;

document.addEventListener('DOMContentLoaded',function(){
  $$('.calc-tab').forEach(function(t){t.addEventListener('click',function(){switchTab(t.dataset.tab)})});
  $$('.shape-pill').forEach(function(p){p.addEventListener('click',function(){setShape(p.dataset.shape)})});
  $$('.area-mode-pill').forEach(function(p){p.addEventListener('click',function(){setAreaMode(p.dataset.mode)})});
  $$('.orient-btn').forEach(function(b){b.addEventListener('click',function(){setOrientation(b.dataset.orient)})});
  $$('.wastage-btn').forEach(function(b){b.addEventListener('click',function(){
    var tab=b.closest('.tab-panel').id.replace('panel-','');
    wastage[tab]=parseInt(b.dataset.value);
    b.closest('.seg-group').querySelectorAll('.seg-btn').forEach(function(x){x.classList.toggle('active',parseInt(x.dataset.value)===wastage[tab])});
    liveUpdate();
  })});
  var ab=$('#addAreaBtn');if(ab)ab.addEventListener('click',addArea);
  var ts=$('#tileSizeSelect');if(ts)ts.addEventListener('change',function(){
    var ci=$('#tileW');var ch=$('#tileH');
    if(ts.value==='custom'){ci.removeAttribute('readonly');ch.removeAttribute('readonly');ci.focus()}
    else{ci.setAttribute('readonly','');ch.setAttribute('readonly','');var p=ts.value.split('x');ci.value=p[0];ch.value=p[1]}
    updateTilesPerM2();liveUpdate();
  });
  var dt=$('#dedToggle');if(dt)dt.addEventListener('click',function(){
    var body=$('#dedBody');var arrow=$('#dedArrow');
    if(body.style.display==='none'){body.style.display='';arrow.textContent='\u25BE'}
    else{body.style.display='none';arrow.textContent='\u25B8'}
  });
  var cb=$('#calcBtn');if(cb)cb.addEventListener('click',calculate);
  var cp=$('#copyBtn');if(cp)cp.addEventListener('click',copyResults);
  var pr=$('#printBtn');if(pr)pr.addEventListener('click',function(){window.print()});
  document.addEventListener('input',function(e){if(e.target.matches('.form-input,.form-select'))liveUpdate()});
  switchTab('tiles');updateTilesPerM2();initFAQ();
});

function switchTab(id){
  currentTab=id;
  $$('.calc-tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===id)});
  $$('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='panel-'+id)});
  var rb=$('.result-box');if(rb)rb.classList.remove('visible');
}
function setShape(s){
  roomShape=s;
  $$('.shape-pill').forEach(function(p){p.classList.toggle('active',p.dataset.shape===s)});
  $$('.shape-panel').forEach(function(p){p.classList.toggle('active',p.dataset.shape===s)});
  liveUpdate();
}
function setAreaMode(m){
  areaMode=m;
  $$('.area-mode-pill').forEach(function(p){p.classList.toggle('active',p.dataset.mode===m)});
  $$('.area-mode-panel').forEach(function(p){p.classList.toggle('active',p.dataset.mode===m)});
  liveUpdate();
}
function setOrientation(o){
  orientation=o;
  $$('.orient-btn').forEach(function(b){b.classList.toggle('active',b.dataset.orient===o)});
  if(o==='diagonal'&&wastage.tiles<15){wastage.tiles=20;$$('#panel-tiles .wastage-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.dataset.value)===20)})}
  liveUpdate();
}

function addArea(){
  if(areaCount>=8)return;areaCount++;
  var c=$('#multiAreas');
  var row=document.createElement('div');row.className='multi-area-row';
  row.innerHTML='<div class="form-group"><input class="form-input" type="text" value="Area '+areaCount+'"></div>'+
    '<div class="form-group"><label class="form-label">L (m)</label><input class="form-input" type="number" value="3" min="0.1" step="0.1"></div>'+
    '<div class="form-group"><label class="form-label">W (m)</label><input class="form-input" type="number" value="3" min="0.1" step="0.1"></div>'+
    '<button class="remove-row-btn" type="button">&times;</button>';
  row.querySelector('.remove-row-btn').addEventListener('click',function(){row.remove();areaCount--;liveUpdate()});
  c.appendChild(row);liveUpdate();
}

function getNetArea(){
  var gross=0;
  if(areaMode==='multi'){
    $$('#multiAreas .multi-area-row').forEach(function(r){
      var ins=r.querySelectorAll('input[type=number]');
      if(ins.length>=2)gross+=(parseFloat(ins[0].value)||0)*(parseFloat(ins[1].value)||0);
    });
  } else if(roomShape==='lshape'){
    var ll=parseFloat($('#lLongL').value)||0;var lw=parseFloat($('#lLongW').value)||0;
    var sl=parseFloat($('#lShortL').value)||0;var sw=parseFloat($('#lShortW').value)||0;
    gross=ll*lw+sl*sw;
  } else {
    var rl,rw;
    if(currentTab==='tiles'){rl=parseFloat($('#tRoomL').value)||0;rw=parseFloat($('#tRoomW').value)||0}
    else if(currentTab==='laminate'){rl=parseFloat($('#lamL').value)||0;rw=parseFloat($('#lamW').value)||0}
    else{rl=parseFloat($('#hwL').value)||0;rw=parseFloat($('#hwW').value)||0}
    gross=rl*rw;
  }
  var ded=parseFloat($('#dedArea').value)||0;
  return Math.max(gross-ded,0);
}

function updateTilesPerM2(){
  var tw=(parseFloat($('#tileW').value)||300)/1000;
  var th=(parseFloat($('#tileH').value)||300)/1000;
  var grout=(parseFloat($('#groutW').value)||3)/1000;
  var tpm2=1/((tw+grout)*(th+grout));
  var d=$('#tilesPerM2Disp');if(d)d.textContent=tpm2.toFixed(2)+' tiles/m\u00B2';
}

function liveUpdate(){
  updateTilesPerM2();
  if($('.result-box')&&$('.result-box').classList.contains('visible'))calculate();
}

function calculate(){
  var netArea=getNetArea();
  if(netArea<=0)return;
  var w=wastage[currentTab]/100;
  var rb=$('.result-box');

  if(currentTab==='tiles'){
    var tw=(parseFloat($('#tileW').value)||300)/1000;
    var th=(parseFloat($('#tileH').value)||300)/1000;
    var grout=(parseFloat($('#groutW').value)||3)/1000;
    var tileArea=(tw+grout)*(th+grout);
    var tilesPerM2=1/tileArea;
    var tilesNet=Math.ceil(netArea*tilesPerM2);
    var tilesOrder=Math.ceil(tilesNet*(1+w));
    var perBox=parseInt($('#tilesPerBox').value)||4;
    var boxes=Math.ceil(tilesOrder/perBox);
    var price=parseFloat($('#tilePrice').value)||0;

    $('#resNetArea').textContent=netArea.toFixed(1);
    $('#resTilesNet').textContent=tilesNet;
    $('#resTilesOrder').textContent=tilesOrder;
    $('#resTilesOrderSub').textContent='+'+wastage.tiles+'% wastage'+(orientation==='diagonal'?' (diagonal)':'');
    $('#resBoxes').textContent=boxes;$('#resBoxesSub').textContent=perBox+' tiles per box';
    $('#resTpm2').textContent=tilesPerM2.toFixed(2);$('#resTpm2Sub').textContent='Including '+($('#groutW').value||3)+'mm grout';
    var costCard=$('#resCostCard');
    if(price>0&&costCard){costCard.style.display='';$('#resCost').textContent='PKR '+(price*tilesOrder).toLocaleString();$('#resCostSub').textContent=price+' \u00D7 '+tilesOrder+' tiles'}
    else if(costCard){costCard.style.display='none'}
    /* show tile results, hide others */
    $$('.res-tiles').forEach(function(e){e.style.display=''});
    $$('.res-laminate,.res-hardwood').forEach(function(e){e.style.display='none'});

  } else if(currentTab==='laminate'){
    var areaW=netArea*(1+w);
    var m2box=parseFloat($('#lamM2Box').value)||2;
    var boxes=Math.ceil(areaW/m2box);
    var underlayCheck=$('#chkUnderlay');
    var rollSize=parseFloat($('#underlayRoll').value)||15;
    var rolls=underlayCheck&&underlayCheck.checked?Math.ceil(netArea/rollSize):0;
    var price=parseFloat($('#lamPrice').value)||0;

    $('#resNetArea').textContent=netArea.toFixed(1);
    $('#resLamArea').textContent=areaW.toFixed(1);
    $('#resLamBoxes').textContent=boxes;$('#resLamBoxesSub').textContent=m2box+' m\u00B2 per box';
    var ulCard=$('#resUnderlayCard');
    if(rolls>0&&ulCard){ulCard.style.display='';$('#resUnderlayRolls').textContent=rolls}
    else if(ulCard){ulCard.style.display='none'}
    var lcCard=$('#resLamCostCard');
    if(price>0&&lcCard){lcCard.style.display='';$('#resLamCost').textContent='PKR '+(price*boxes).toLocaleString();$('#resLamCostSub').textContent=price+' \u00D7 '+boxes+' boxes'}
    else if(lcCard){lcCard.style.display='none'}
    $$('.res-laminate').forEach(function(e){e.style.display=''});
    $$('.res-tiles,.res-hardwood').forEach(function(e){e.style.display='none'});

  } else {
    var areaW=netArea*(1+w);
    var bw=(parseFloat($('#hwBoardW').value)||120)/1000;
    var bl=parseFloat($('#hwBoardL').value)||1.8;
    var boardArea=bw*bl;
    var boards=Math.ceil(areaW/boardArea);
    var price=parseFloat($('#hwPrice').value)||0;

    $('#resNetArea').textContent=netArea.toFixed(1);
    $('#resHwArea').textContent=areaW.toFixed(1);
    $('#resHwBoards').textContent=boards;
    var hcCard=$('#resHwCostCard');
    if(price>0&&hcCard){hcCard.style.display='';$('#resHwCost').textContent='PKR '+(price*areaW).toLocaleString();$('#resHwCostSub').textContent=price+' per m\u00B2'}
    else if(hcCard){hcCard.style.display='none'}
    $$('.res-hardwood').forEach(function(e){e.style.display=''});
    $$('.res-tiles,.res-laminate').forEach(function(e){e.style.display='none'});
  }

  rb.classList.add('visible');rb.scrollIntoView({behavior:'smooth',block:'start'});
}

function copyResults(){
  var t='Flooring Calculation\nArea: '+($('#resNetArea')||{}).textContent+' m\u00B2\n';
  if(currentTab==='tiles')t+='Tiles: '+($('#resTilesOrder')||{}).textContent+'\nBoxes: '+($('#resBoxes')||{}).textContent;
  else if(currentTab==='laminate')t+='Boxes: '+($('#resLamBoxes')||{}).textContent;
  else t+='Boards: '+($('#resHwBoards')||{}).textContent;
  t+='\n\nCalculated at BuildCalcTools.site';
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
