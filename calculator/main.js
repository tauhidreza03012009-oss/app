import {Memory} from "./memory.js";

let table=document.getElementById("table")
let input=document.getElementById("inp")
let input2=document.getElementById("inp2")
let buttons= ["AC","(",")","÷","7","8","9","x","4","5","6","—","1","2","3","+","0",".","⌫","="]
let dict={
  "÷":"/",
  "x":"*",
  "AC":"",
  "—":"-",
  "⌫":"",
  "=":""
}
let operation=["+","—","x","÷"]
let dict2={
  "AC":"",
  "⌫":"",
  "=":""
}

let mem= new Memory()

for(let i=0;i<5;i++){
  let tr= document.createElement("tr")
  for(let j=0;j<4;j++){
    let td= document.createElement("td")
    td.innerHTML=buttons[i*4+j]
    td.className="btns"
    td.addEventListener('click',()=>{
      cont(td.innerHTML)
    })
    tr.appendChild(td)
  }
  table.appendChild(tr)
}

let equ=""
function cont(text){
  input2.value="";
  if(text in operation){}
  else{console.log("hit");if(input2.value){console.log("ht");input.value="";equ=""}}
  if(text=="="){ answering()}
  if(text=="AC"){equ="";input.value=""}
  let w=(text in dict2)? dict2[text]:text;
  let n=(text in dict)? dict[text]:text;
  input.value+=w; 
  equ+=n
}

function answering(){
  let k=eval(equ); 
  console.log(mem);
  input2.value=input.value;
  input.value=k;
  mem.push(equ,k)
}