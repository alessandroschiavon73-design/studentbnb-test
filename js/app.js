(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="studentbnbCompare";
const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return[]}};
const set=v=>{localStorage.setItem(KEY,JSON.stringify(v.slice(0,4)));count()};
const count=()=>{const x=$("#compareCount");if(x)x.textContent=get().length};count();

const menu=$("#menuBtn"),nav=$("#nav"); if(menu&&nav)menu.onclick=()=>nav.classList.toggle("open");

function card(x,home=false){
return `<article class="listing-card ${home?'home-card':''}">
<a class="card-photo" href="detail.html?id=${x.id}"><img src="${x.img}" alt="${x.title}"></a>
<div class="card-content"><small>${x.type} · ${x.zone}</small><h3><a href="detail.html?id=${x.id}">${x.title}</a></h3>
<div class="price"><b>${x.rent} €</b><span>+ ${x.real-x.rent} € spese</span></div>
<div class="total">Totale ${x.real} €</div>
<div class="card-bottom"><span>${x.minutes} min · Università</span><strong>${x.score.toFixed(1).replace(".",",")}</strong></div>
${home?"":`<label class="compare-check"><input type="checkbox" data-compare="${x.id}" ${get().includes(x.id)?"checked":""}> Confronta</label>`}
</div></article>`}

const hc=$("#homeCards");if(hc&&window.STUDENTBNB_LISTINGS)hc.innerHTML=STUDENTBNB_LISTINGS.slice(0,4).map(x=>card(x,true)).join("");

const grid=$("#listingGrid");
if(grid){
const type=$("#typeFilter"),zone=$("#zoneFilter"),price=$("#priceFilter"),bills=$("#billsFilter");
function render(){
let items=STUDENTBNB_LISTINGS.filter(x=>(type.value==="all"||x.type===type.value)&&(zone.value==="all"||x.zone===zone.value)&&x.real<=+price.value&&(!bills.checked||x.billsIncluded)).sort((a,b)=>a.real-b.real);
$("#resultCount").textContent=items.length;grid.innerHTML=items.map(x=>card(x)).join("");
$$("[data-compare]").forEach(cb=>cb.onchange=e=>{let ids=get(),id=+e.target.dataset.compare;if(e.target.checked){if(ids.length>=4){e.target.checked=false;alert("Puoi confrontare fino a 4 alloggi.");return}if(!ids.includes(id))ids.push(id)}else ids=ids.filter(v=>v!==id);set(ids)});
}
[type,zone,price,bills].forEach(x=>x.onchange=render);render();
}

const root=$("#detailRoot");
if(root){
const id=+(new URLSearchParams(location.search).get("id")||1),x=STUDENTBNB_LISTINGS.find(v=>v.id===id)||STUDENTBNB_LISTINGS[0];
$("#detailPhoto").src=x.img;$("#detailZone").textContent="PADOVA · "+x.zone.toUpperCase();$("#detailTitle").textContent=x.title;$("#detailScore").textContent=x.score.toFixed(1).replace(".",",");
$("#detailMeta").textContent=`${x.type} · ${x.minutes} min dall'università`;$("#rentPrice").textContent=x.rent+" €";$("#realPrice").textContent=x.real+" €/mese";
$("#condoPrice").textContent=x.condo?x.condo+" €":"Incluso";$("#billPrice").textContent=x.billsIncluded?"Incluse":x.bills+" € stimate";$("#depositPrice").textContent=x.deposit;$("#noticePrice").textContent=x.notice;$("#durationPrice").textContent=x.duration;$("#wifiInfo").textContent=x.wifi?"Incluso":"Non incluso";
const b=$("#detailCompareBtn");function sync(){b.textContent=get().includes(x.id)?"Rimuovi dal confronto":"Aggiungi al confronto"}b.onclick=()=>{let ids=get();if(ids.includes(x.id))ids=ids.filter(v=>v!==x.id);else if(ids.length<4)ids.push(x.id);else return alert("Puoi confrontare fino a 4 alloggi.");set(ids);sync()};sync();
}

const wrap=$("#compareTableWrap");
if(wrap){
const selected=get().map(id=>STUDENTBNB_LISTINGS.find(x=>x.id===id)).filter(Boolean),empty=$("#compareEmpty");
if(selected.length){empty.style.display="none";const rows=[
["Costo reale",x=>x.real+" €/mese"],["Canone",x=>x.rent+" €"],["Bollette",x=>x.billsIncluded?"Incluse":x.bills+" € stimate"],["Condominio",x=>x.condo+" €"],["Deposito",x=>x.deposit],["Preavviso",x=>x.notice],["Durata minima",x=>x.duration],["Università",x=>x.minutes+" min"],["Wi-Fi",x=>x.wifi?"Incluso":"No"],["StudentBnB Score",x=>x.score.toFixed(1).replace(".",",")+"/10"]];
wrap.innerHTML=`<div class="compare-scroll"><table><thead><tr><th>Caratteristica</th>${selected.map(x=>`<th>${x.title}<small>${x.zone}</small></th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b></td>${selected.map(x=>`<td>${r[1](x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}}
})();