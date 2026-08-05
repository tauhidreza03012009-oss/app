import { Home } from "./home.js"
import { Dash } from "./dashboard.js"

let box = document.getElementById("main")
let home = document.getElementById("home")
let dash = document.getElementById("dashboard")
let buttons =[box,home,dash]
home.addEventListener('click',()=>{
  selection(home)
  Home(box);
})
dash.addEventListener('click',()=>{
  selection(dash)
  Dash(box);
})


function selection(btn){
  buttons.forEach(x=>{
    x.classList.remove("selected")
  })
  console.log(btn)
  btn.className="selected"
}


selection(home)
Home(box)