export function commandInp(command){
  command=command.toLowerCase().trim()
  if(command=="open terminal")Terminal();
  if(command=="close terminal")closeTerminal();
}

function Terminal(){
  let div=document.createElement("div")
  dived(div);
  div.id="terminal"
  div.className="term"
  document.body.appendChild(div)
}

function dived(div){
  let div1=document.createElement("div")
  let btn=document.createElement("button")
  btn.innerHTML="❌"
  btn.className="delete"
  btn.addEventListener("click",closeTerminal)
  div1.appendChild(btn)
  div.appendChild(div1)
}

function closeTerminal(){
  try{
     let div=document.getElementById("terminal")
    div.classList.add("reversal")
    div.addEventListener("animationend", () => {
             div.remove();
          }, { once: true }); 
  }
  catch{
    return
  }
  
}