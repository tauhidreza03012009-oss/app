export function Home(mainbox){
  
  let div1 = document.createElement("div")
  let div = document.createElement("div")
  div.classList="timer"
  let text2 = document.createElement("p")

  let time = new Date().toLocaleTimeString()
  text2.innerHTML = time
  text2.className="time"
  let timeCheck = setInterval(()=>{
    text2.innerHTML = time;
    time = new Date().toLocaleTimeString()
  },1000)
  
  div1.appendChild(text2)
  div.appendChild(div1)
  mainbox.innerHTML = "";
  mainbox.appendChild(div)
}