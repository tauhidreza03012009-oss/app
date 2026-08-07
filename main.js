import {show,battaryNotif} from "./notification.js"
import {commandInp} from "./command.js"

let time1 = document.getElementById('time');
let jarv = document.getElementById('cor');
let com = document.getElementById('command');
let cominp = document.getElementById('com');
let ind = document.getElementById('rr');
let time2 = document.getElementById('timer');
let time3 = document.getElementById('rdate');
let time4 = document.getElementById('rmonth');
let baterry = document.getElementById('device');
let notif = document.getElementById('notification');
let notifcenter = document.getElementById("paper");
let wrap = document.getElementById('wraper');
let table= document.createElement("table")
let tr1= document.createElement("tr")
let td1= document.createElement("td")
let td2= document.createElement("td")
let tr2= document.createElement("tr")
let td3= document.createElement("td")
let td4= document.createElement("td")
let tr3= document.createElement("tr")
let td5= document.createElement("td")
let td6= document.createElement("td")
let tr4= document.createElement("tr")
let td7= document.createElement("td")
let td8= document.createElement("td")
let btn= document.createElement("button")
btn.className = "rbtn"
tr1.appendChild(td1)
tr1.appendChild(td2)
tr2.appendChild(td3)
tr2.appendChild(td4)
tr3.appendChild(td5)
tr3.appendChild(td6)
tr4.appendChild(td7)
tr4.appendChild(td8)
table.appendChild(tr1)
table.appendChild(tr2)
table.appendChild(tr3)
table.appendChild(tr4)
baterry.appendChild(table)
wrap.appendChild(btn)
wrap.classList="rev"
com.classList="swiper"
notifcenter.className="invisib"

let batteryObj = null;
let secondsRemaining = null;

if ('getBattery' in navigator) {
  navigator.getBattery().then(b => {
    batteryObj = b;
    secondsRemaining = b.charging ? b.chargingTime : b.dischargingTime;
    b.addEventListener('chargingchange', () => {
      secondsRemaining = b.charging ? b.chargingTime : b.dischargingTime;
    });
  });
}

extractTime();
setInterval(extractTime, 1000);

function extractTime() {
  let time = new Date();
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');
  const dd = String(time.getDate()).padStart(2, '0');
  const mn = time.toLocaleString('default', { month: 'short' });
  const time24 = `${hh}:${mm}:${ss}`;
  
  if (time1) time1.innerHTML = time24;
  if (time2) time2.innerHTML = time24;
  if (time3) time3.innerHTML = dd;
  if (time4) time4.innerHTML = mn;

  if (secondsRemaining !== null && isFinite(secondsRemaining) && secondsRemaining > 0) {
    secondsRemaining--;
  }

  updateBatteryDisplay();
}

function updateBatteryDisplay() {
  if (!batteryObj || !baterry) return;
  td1.innerHTML="♦ Battery Level "
  td2.innerHTML = `— ${Math.round(batteryObj.level * 100)}%`;
  td3.innerHTML= `♦ Charging  `
  td4.innerHTML=`— ${batteryObj.charging}`;
  battaryNotif(batteryObj.level)
  
  const formattedTime = (secondsRemaining !== null && isFinite(secondsRemaining)) 
    ? `${secondsRemaining} s` 
    : 'Calc...';
  setR2Speed(1)
  document.body.classList.remove("charging","normal")
  if (batteryObj.charging) {
    document.body.classList.add("charging")
    setR2Speed(5)
    td5.innerHTML="♦ Time needed "
    td6.innerHTML=`—  ${formattedTime}`;
  } else {
    document.body.classList.add("normal")
    td5.innerHTML="♦ Time remained  "
    td6.innerHTML=`— ${formattedTime}`;
  }
}


let checker = setInterval(()=>{
  td7.innerHTML="♦ Internet "
  td8.innerHTML = `— ${(navigator.onLine)}`
},3000)

btn.addEventListener('click',()=>{
  const hasrev = wrap.classList.contains('rev');
  wrap.classList.remove('rev', 'swiper');
  console.log(wrap.classList)
  void wrap.offsetWidth;
  if (hasrev) {
    wrap.classList.add('swiper');
  } else {
    wrap.classList.add('rev');
  }
})

jarv.addEventListener("click",()=>{
  const hasrev = com.classList.contains('rev');
  com.classList.remove('rev', 'swiper');
  void com.offsetWidth;
  if (hasrev) {
    com.classList.add('swiper');
    cominp.blur()
  } else {
    com.classList.add('rev');
    cominp.focus()
    if ('virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
    }

    if (navigator.virtualKeyboard) {
      navigator.virtualKeyboard.show();
    }
  }
})

cominp.addEventListener('keydown',(event)=>{
  if (event.key === 'Enter') {
    commandInp(cominp.value)
    cominp.value=""
    com.classList.remove('rev', 'swiper');
    void com.offsetWidth;
    event.preventDefault();
    com.classList.add('swiper');
    cominp.blur()
  }
})

notif.addEventListener('click',()=>{
  notifcenter.classList.toggle("invisib")
  notifcenter.classList.toggle("visib")
})

function setR2Speed(speedMultiplier) {
  const anims = ind.getAnimations();
  if (anims.length > 0) {
    anims[0].playbackRate = speedMultiplier; 
  }
}