let options =["weather","files","projects","notes","tools"]

export function Dash(mainbox){
  let div = document.createElement("div")
  let text1 = document.createElement("p")
  text1.innerHTML="Explor anything you want from this list :— "
  div.appendChild(text1)
  
  for(let i =0;i<options.length;i++){
    let text2 = document.createElement("p")
    text2.innerHTML=`${i+1}.  ${options[i]}`
    text2.className="opt"
    div.appendChild(text2)
  }

  mainbox.innerHTML = "";
  mainbox.appendChild(div)
}