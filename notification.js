let not= document.getElementById("notif")
let notifications=document.createElement("ul")
notifications.type="disc"
let current=JSON.parse(localStorage.getItem("current"))||[]
let can_giv=["Battery under 15 now","Go to sleep now bro its too late","Wake up . its morning already","Fully charged"]

export function show(){
  notifications.innerHTML=""
  for(let i=0;i<current.length;i++){
    let ls=document.createElement("list")
    ls.innerHTML=`♦  ${current[i]}`
    notifications.appendChild(ls)
  }
  not.appendChild(notifications)
}

export function battaryNotif(chargenorm){
  let charge=Number(chargenorm)*100;
  if(current.includes(can_giv[0])){
    if(charge>15){
      current=current.filter(x=>x!=current[0])
    }
  }
  else{if(charge<15)current.push(can_giv[0]);
}

  localStorage.setItem("current",JSON.stringify(current))
  show()
}